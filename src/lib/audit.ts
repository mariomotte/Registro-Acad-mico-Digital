import { supabase } from "./supabase"

interface AuditParams {
  userId?: string;
  userEmail?: string;
  userName?: string;
  modulo: string;
  accion: string;
  registroId?: string;
  descripcion: string;
  datosAnteriores?: any;
  datosNuevos?: any;
}

/**
 * Utility to standardise audit logs writing on Supabase
 */
export async function logAudit({
  userId,
  userEmail,
  userName,
  modulo,
  accion,
  registroId,
  descripcion,
  datosAnteriores,
  datosNuevos
}: AuditParams) {
  try {
    const finalUserName = userName || userEmail || 'Sistema'
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        usuario: finalUserName,
        usuario_id: userId || null,
        modulo,
        accion,
        registro_id: registroId || null,
        descripcion,
        datos_anteriores: datosAnteriores || null,
        datos_nuevos: datosNuevos || null
      }])
    
    if (error) throw error
  } catch (err) {
    console.error("Failed to write audit log:", err)
  }
}
