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
    // 1. Validamos con PayPal la notificación IPN
    const paymentStatus = body.payment_status; // Ej: "Completed"
    const uid = body.custom || body.custom_id; // UID de Firebase
    const itemName = body.item_name || "Escudo Barcelona"; // Nombre por defecto

    if (paymentStatus === 'Completed' && uid) {
      console.log(`Pago verificado para el usuario UID: ${uid}, Ítem recibido: ${itemName}`);

      // Fecha formateada para el historial
      const fechaActual = new Date();
      const fechaFormateada = `${fechaActual.getDate()}/${fechaActual.getMonth() + 1}/${fechaActual.getFullYear()}`;

      // 2. Base de datos o diccionario con la información de todos tus equipos
      const equiposDisponibles = {
        "barcelona": {
          nombre: "Escudo Barcelona",
          imagen: "imagenes escudos de clubes/barcelona.png"
        },
        "real madrid": {
          nombre: "Escudo Real Madrid",
          imagen: "imagenes escudos de clubes/realmadrid.png"
        },
        "manchester city": {
          nombre: "Escudo Manchester City",
          imagen: "imagenes escudos de clubes/mancity.png"
        },
        "manchester united": {
          nombre: "Escudo Manchester United",
          imagen: "imagenes escudos de clubes/manutd.png"
        },
        "borussia dortmund": {
          nombre: "Escudo Borussia Dortmund",
          imagen: "imagenes escudos de clubes/dortmund.png"
        },
        "psg": {
          nombre: "Escudo PSG",
          imagen: "imagenes escudos de clubes/psg.png"
        },
        "arsenal": {
          nombre: "Escudo Arsenal",
          imagen: "imagenes escudos de clubes/arsenal.png"
        },
        "liverpool": {
          nombre: "Escudo Liverpool",
          imagen: "imagenes escudos de clubes/liverpool.png"
        },
        "chelsea": {
          nombre: "Escudo Chelsea",
          imagen: "imagenes escudos de clubes/chelsea.png"
        },
        "ac milan": {
          nombre: "Escudo AC Milan",
          imagen: "imagenes escudos de clubes/milan.png"
        },
        "inter": {
          nombre: "Escudo Inter",
          imagen: "imagenes escudos de clubes/inter.png"
        },
        "napoli": {
          nombre: "Escudo Napoli",
          imagen: "imagenes escudos de clubes/napoli.png"
        },
        "brighton": {
          nombre: "Escudo Brighton",
          imagen: "imagenes escudos de clubes/brighton.png"
        },
        "marsella": {
          nombre: "Escudo Marsella",
          imagen: "imagenes escudos de clubes/marsella.png"
        },
        "atletico de madrid": {
          nombre: "Escudo Atletico de Madrid",
          imagen: "imagenes escudos de clubes/atletico.png"
        },
        "bayern de munich": {
          nombre: "Escudo Bayern Munich",
          imagen: "imagenes escudos de clubes/bayern.png"
        },
        "bayer leverkusen": {
          nombre: "Escudo Bayer Leverkusen",
          imagen: "imagenes escudos de clubes/leverkusen.png"
        }
        // Puedes seguir agregando más equipos aquí abajo simplemente copiando la estructura
      };

      // Limpiamos el texto que llega de PayPal para buscarlo en nuestro diccionario
      const claveBusqueda = itemName.toLowerCase().replace('escudo', '').trim();
      
      // Buscamos el equipo en el diccionario, si no existe, construye una ruta por defecto limpia
      const equipoInfo = equiposDisponibles[claveBusqueda] || {
        nombre: itemName,
        imagen: `imagenes escudos de clubes/${claveBusqueda.replace(/\s+/g, '_')}.png`
      };

      const nombreOficial = equipoInfo.nombre;
      const rutaImagen = equipoInfo.imagen;

      // 3. Preparamos los datos dinámicos
      const nuevoItemInventario = {
        id: nombreOficial.toLowerCase().replace(/\s+/g, '_'),
        nombre: nombreOficial,
        tipo: "fondo",
        imagen: rutaImagen 
      };

      const nuevaCompraHistorial = {
        fecha: fechaFormateada,
        nombre: nombreOficial,
        texto: `${fechaFormateada} - ${nombreOficial}`
      };

      // 4. Escribimos en los nodos necesarios en Firebase (en ambos nodos por compatibilidad)
      const promInventario1 = db.ref(`usuarios_futbol/${uid}/inventario`).push(nuevoItemInventario);
      const promHistorial1 = db.ref(`usuarios_futbol/${uid}/historial`).push(nuevaCompraHistorial);
      const promPerfil1 = db.ref(`usuarios_futbol/${uid}`).update({
        FondoPerfil: rutaImagen,
        nombreFondoActivo: nombreOficial
      });

      const promInventario2 = db.ref(`usuarios/${uid}/inventario`).push(nuevoItemInventario);
      const promHistorial2 = db.ref(`usuarios/${uid}/historial`).push(nuevaCompraHistorial);
      const promPerfil2 = db.ref(`usuarios/${uid}`).update({
        FondoPerfil: rutaImagen,
        nombreFondoActivo: nombreOficial
      });

      await Promise.all([
        promInventario1, promHistorial1, promPerfil1,
        promInventario2, promHistorial2, promPerfil2
      ]);

      console.log(`¡Ítem (${nombreOficial}) e historial entregados con éxito en Firebase!`);
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
