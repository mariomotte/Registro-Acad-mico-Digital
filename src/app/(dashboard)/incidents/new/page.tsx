
"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ClipboardList, Upload, Camera, Save, Sparkles, Loader2, X, AlertTriangle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { refineIncidentReport } from "@/ai/flows/refine-incident-report"
import { useFirestore, useUser, addDocumentNonBlocking, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, doc, query, orderBy } from "firebase/firestore"
import { Usuario, Alumno } from "@/types"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

export default function NewIncidentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedStudentId = searchParams.get('studentId') || ""
  
  const { toast } = useToast()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  
  const userDocRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user])
  const { data: profile } = useDoc<Usuario>(userDocRef)

  const studentsQuery = useMemoFirebase(() => query(collection(db, "students"), orderBy("apellido", "asc")), [db])
  const { data: students, isLoading: isLoadingStudents } = useCollection<Alumno>(studentsQuery)

  const [isLoading, setIsLoading] = useState(false)
  const [isRefining, setIsRefining] = useState(false)
  const [description, setDescription] = useState("")
  const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId)
  const [type, setType] = useState("")
  const [severity, setSeverity] = useState("bajo")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  
  // Evidence states
  const [evidences, setEvidences] = useState<string[]>([])
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (preselectedStudentId) setSelectedStudentId(preselectedStudentId)
  }, [preselectedStudentId])

  // Camera permission and stream handling
  useEffect(() => {
    let stream: MediaStream | null = null;

    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    if (isCameraOpen) {
      getCameraPermission();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOpen]);

  const handleRefineDescription = async () => {
    if (!description.trim()) {
      toast({
        variant: "destructive",
        title: "Descripción vacía",
        description: "Escribe algo primero para refinar.",
      })
      return
    }

    setIsRefining(true)
    try {
      const student = students?.find(s => s.id === selectedStudentId)
      const studentName = student ? `${student.nombre} ${student.apellido}` : ""
      
      const result = await refineIncidentReport({
        roughDescription: description,
        studentName
      })
      
      setDescription(result.refinedText)
      toast({
        title: "Reporte refinado",
        description: "La IA ha mejorado la redacción de tu reporte.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de IA",
        description: "No se pudo refinar el reporte.",
      })
    } finally {
      setIsRefining(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEvidences(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        const dataUri = canvas.toDataURL("image/jpeg")
        setEvidences(prev => [...prev, dataUri])
        setIsCameraOpen(false)
        toast({ title: "Foto capturada" })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Espera a que cargue tu perfil.",
      })
      return
    }

    setIsLoading(true)
    
    const student = students?.find(s => s.id === selectedStudentId)
    const studentName = student ? `${student.nombre} ${student.apellido}` : "Desconocido"

    const incidentData = {
      alumnoId: selectedStudentId,
      alumnoNombre: studentName,
      tipo: type,
      descripcion: description,
      severidad: severity,
      fecha: new Date(date).toISOString(),
      registradoPor: `${profile.firstName} ${profile.lastName}`,
      registradorUserId: user.uid,
      evidenceUrls: evidences,
    }

    try {
      addDocumentNonBlocking(collection(db, "incidences"), incidentData)
      toast({ title: "Registro exitoso" })
      router.push("/incidents")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudo guardar la incidencia.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-headline">Nueva Incidencia</h2>
          <p className="text-muted-foreground">Registra un nuevo suceso para un alumno.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-none shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList size={20} className="text-primary" />
              Detalles del Reporte
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="student">Seleccionar Alumno</Label>
                <Select required onValueChange={setSelectedStudentId} value={selectedStudentId}>
                  <SelectTrigger id="student">
                    <SelectValue placeholder={isLoadingStudents ? "Cargando alumnos..." : "Buscar alumno..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.nombre} {s.apellido} ({s.grado} {s.seccion})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Incidencia</Label>
                <Select required onValueChange={setType} value={type}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inasistencia">Inasistencia</SelectItem>
                    <SelectItem value="Tardanza">Tardanza</SelectItem>
                    <SelectItem value="Problema de comportamiento">Problema de comportamiento</SelectItem>
                    <SelectItem value="Problema de salud">Problema de salud</SelectItem>
                    <SelectItem value="Conflicto entre alumnos">Conflicto entre alumnos</SelectItem>
                    <SelectItem value="Observación académica">Observación académica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="severity">Nivel de Gravedad</Label>
                <Select required onValueChange={setSeverity} value={severity}>
                  <SelectTrigger id="severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bajo">Bajo</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha del Suceso</Label>
                <Input 
                  id="date" 
                  type="datetime-local" 
                  required 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Descripción Detallada</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-accent hover:text-accent hover:bg-accent/10 h-8 gap-1.5"
                  onClick={handleRefineDescription}
                  disabled={isRefining || !description.trim()}
                >
                  {isRefining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {isRefining ? "Refinando..." : "Refinar con IA"}
                </Button>
              </div>
              <Textarea 
                id="description" 
                placeholder="Escribe lo ocurrido. Luego usa la IA para profesionalizar el texto..." 
                className="min-h-[140px]"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label>Evidencias (Opcional)</Label>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {evidences.map((src, index) => (
                  <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border bg-slate-100">
                    <img src={src} alt={`Evidencia ${index + 1}`} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setEvidences(prev => prev.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                <div onClick={() => setIsCameraOpen(true)} className="border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 text-muted-foreground hover:text-primary">
                  <Camera size={20} />
                  <span className="text-[10px] mt-1 font-semibold uppercase">Capturar</span>
                </div>
                
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 text-muted-foreground hover:text-primary">
                  <Upload size={20} />
                  <span className="text-[10px] mt-1 font-semibold uppercase">Subir</span>
                </div>
                
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t py-4 flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" className="bg-primary" disabled={isLoading || !profile}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Reporte
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Capturar Evidencia</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Cámara denegada</AlertTitle>
                <AlertDescription>Habilita los permisos en tu navegador.</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCameraOpen(false)}>Cancelar</Button>
            <Button onClick={capturePhoto} disabled={!hasCameraPermission} className="bg-primary">
              <Camera className="mr-2 h-4 w-4" /> Tomar Foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
