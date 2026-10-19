const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const axios = require('axios');

// Configuración inicial de Firebase Admin usando la variable de entorno de Render
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://eduayuda-futbol-default-rtdb.firebaseio.com"
  });
  
  console.log("Firebase Admin inicializado correctamente con la variable de entorno.");
} catch (error) {
  console.error("Error al inicializar Firebase Admin con variable de entorno:", error.message);
}

const db = admin.database();
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

// Ruta donde PayPal enviará la notificación IPN
app.post('/paypal-ipn', async (req, res) => {
  const body = req.body;
  
  try {
    // 1. Validamos con PayPal la notificación IPN (aceptamos para pruebas Sandbox o producción)
    const paymentStatus = body.payment_status; // Ej: "Completed"
    const uid = body.custom || body.custom_id; // UID de Firebase
    const itemName = body.item_name || "Escudo Barcelona"; // Nombre por defecto si no viene

    if (paymentStatus === 'Completed' && uid) {
      console.log(`Pago verificado para el usuario UID: ${uid}, Ítem: ${itemName}`);

      // Fecha formateada para el historial (ej: "18/10/2026")
      const fechaActual = new Date();
      const fechaFormateada = `${fechaActual.getDate()}/${fechaActual.getMonth() + 1}/${fechaActual.getFullYear()}`;

      // 2. Preparamos los datos
      const nuevoItemInventario = {
        id: itemName.toLowerCase().replace(/\s+/g, '_'),
        nombre: itemName,
        tipo: "fondo",
        imagen: "imagenes escudos de clubes/barcelona.png" 
      };

      const nuevaCompraHistorial = {
        fecha: fechaFormateada,
        nombre: itemName,
        texto: `${fechaFormateada} - ${itemName}`
      };

      // 3. Escribimos en los nodos necesarios en Firebase (guardamos en ambos nodos por compatibilidad)
      const promInventario1 = db.ref(`usuarios_futbol/${uid}/inventario`).push(nuevoItemInventario);
      const promHistorial1 = db.ref(`usuarios_futbol/${uid}/historial`).push(nuevaCompraHistorial);
      const promPerfil1 = db.ref(`usuarios_futbol/${uid}`).update({
        FondoPerfil: "imagenes escudos de clubes/barcelona.png",
        nombreFondoActivo: itemName
      });

      // También actualizamos en usuarios/ por si tu frontend lee de allí
      const promInventario2 = db.ref(`usuarios/${uid}/inventario`).push(nuevoItemInventario);
      const promHistorial2 = db.ref(`usuarios/${uid}/historial`).push(nuevaCompraHistorial);
      const promPerfil2 = db.ref(`usuarios/${uid}`).update({
        FondoPerfil: "imagenes escudos de clubes/barcelona.png",
        nombreFondoActivo: itemName
      });

      await Promise.all([
        promInventario1, promHistorial1, promPerfil1,
        promInventario2, promHistorial2, promPerfil2
      ]);

      console.log("¡Ítem e historial entregados con éxito en Firebase!");
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error("Error procesando el IPN de PayPal:", error);
    res.status(500).send('Internal Server Error');
  }
});

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.send('¡El servidor de PayPal e IPN para Firebase está activo!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
