const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const axios = require('axios');

// Configuración inicial de Firebase Admin usando las variables de entorno o la configuración predeterminada
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://eduayuda-futbol-default-rtdb.firebaseio.com" // Tu Realtime Database
});

const db = admin.database();
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

// Ruta donde PayPal enviará la notificación IPN
app.post('/paypal-ipn', async (req, res) => {
  const body = req.body;
  
  try {
    // 1. Validamos con PayPal que la notificación sea legítima (simulación de validación IPN)
    const validationBody = 'cmd=_notify-validate&' + Object.keys(body).map(key => `${key}=${encodeURIComponent(body[key])}`).join('&');
    const verification = await axios.post('https://ipnpb.paypal.com/cgi-bin/webscr', validationBody);

    if (verification.data === 'VERIFIED') {
      const paymentStatus = body.payment_status; // Ej: "Completed"
      const uid = body.custom_id; // El UID de Firebase que viaja en el enlace de pago
      const itemName = body.item_name; // Nombre del producto comprado

      if (paymentStatus === 'Completed' && uid) {
        console.log(`Pago verificado para el usuario UID: ${uid}, Ítem: ${itemName}`);

        // 2. Preparamos los datos del ítem para el inventario
        const nuevoItemInventario = {
          id: itemName.toLowerCase().replace(/\s+/g, '_'),
          nombre: itemName,
          tipo: "fondo",
          imagen: "imagenes escudos de clubes/barcelona.png" 
        };

        // 3. Insertamos en Firebase el inventario y actualizamos FondoPerfil
        const promInventario = db.ref(`usuarios_futbol/${uid}/inventario`).push(nuevoItemInventario);
        const promPerfil = db.ref(`usuarios_futbol/${uid}`).update({
          FondoPerfil: "imagenes escudos de clubes/barcelona.png",
          nombreFondoActivo: itemName
        });

        await Promise.all([promInventario, promPerfil]);
        console.log("¡Ítem entregado con éxito en Firebase vía IPN!");
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error("Error procesando el IPN de PayPal:", error);
    res.status(500).send('Internal Server Error');
  }
});

// Ruta de bienvenida para la página principal
app.get('/', (req, res) => {
  res.send('¡El servidor de PayPal e IPN para Firebase está activo y funcionando correctamente!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
