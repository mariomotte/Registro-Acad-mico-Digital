const admin = require('firebase-admin');
admin.initializeApp(); 

const db = admin.firestore();

async function simularCuadernoOptimizado() {
  console.log("Iniciando inyección OPTIMIZADA con Batches...");
  
  let batch = db.batch(); // Creamos nuestra primera "caja"
  let operacionesEnLote = 0;
  let totalInasistencias = 0;
  let alumnosConAlerta = 0;

  const inicioTiempo = Date.now();

  for (let i = 1; i <= 500; i++) {
    const numeroDeInasistencias = Math.floor(Math.random() * 6); 
    
    if (numeroDeInasistencias >= 4) alumnosConAlerta++;

    for (let f = 1; f <= numeroDeInasistencias; f++) {
      // Preparamos el documento pero aún no lo enviamos
      const docRef = db.collection('incidencias').doc(); 
      batch.set(docRef, {
        alumno_id: `ALU-${i}`,
        tipo_falta: 'INASISTENCIA',
        gravedad: 'LEVE',
        correlativo_falta: f,
        fecha_registro: admin.firestore.FieldValue.serverTimestamp()
      });
      
      operacionesEnLote++;
      totalInasistencias++;

      // Firestore permite máximo 500 por lote. Lo enviamos cuando llegue a 450 para estar seguros.
      if (operacionesEnLote >= 450) {
        await batch.commit(); // Enviamos la caja
        console.log(`📦 Lote de ${operacionesEnLote} registros enviado a Firebase...`);
        batch = db.batch(); // Abrimos una caja nueva
        operacionesEnLote = 0; // Reiniciamos el contador de la caja
      }
    }
  }

  // Si sobraron registros en la última caja, los enviamos
  if (operacionesEnLote > 0) {
    await batch.commit();
    console.log(`📦 Lote final de ${operacionesEnLote} registros enviado...`);
  }

  const finTiempo = Date.now();
  const tiempoTotal = (finTiempo - inicioTiempo) / 1000;
  
  console.log(`\n✅ ¡Éxito total!`);
  console.log(`- Se inyectaron ${totalInasistencias} faltas en solo ${tiempoTotal} segundos.`);
  console.log(`- Aprox ${alumnosConAlerta} alumnos deberían disparar tu alerta de 4ta inasistencia.`);
}

simularCuadernoOptimizado().catch(console.error);