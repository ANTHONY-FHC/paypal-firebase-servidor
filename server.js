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
    // 1. Validamos con PayPal la notificación IPN mediante _notify-validate
    let validationBody = 'cmd=_notify-validate';
    for (let key in body) {
      if (body.hasOwnProperty(key)) {
        validationBody += `&${key}=${encodeURIComponent(body[key])}`;
      }
    }

    const paypalUrl = 'https://ipnpb.paypal.com/cgi-bin/webscr';
    const verificationResponse = await axios.post(paypalUrl, validationBody, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    // 2. Solo continuamos si PayPal confirma que la transacción es real ("VERIFIED")
    if (verificationResponse.data.trim() === 'VERIFIED') {

      const paymentStatus = body.payment_status; // Ej: "Completed"
      const uid = body.custom || body.custom_id; // UID de Firebase
      const itemName = body.item_name || "Escudo Barcelona"; // Nombre por defecto

      if (paymentStatus === 'Completed' && uid) {
      console.log(`Pago verificado para el usuario UID: ${uid}, Ítem recibido: ${itemName}`);

     const idBotonPayPal = body.item_number; 
      // 1. Diccionarios con los códigos de los botones de PayPal
      const packsMonedas = {
     'QDC4JL76U87WY': 500,   // Pack de 500 GolCoins
     '4PRHPLP9DRMGU': 1500,  // Pack de 1,500 GolCoins
     'BCGEK4KX3GEH6': 3500,  // Pack de 3,500 GolCoins
     'K2LUTJJVV2JTU': 6500,  // Pack de 6,500 GolCoins
     '6ARQXQM6D6JUA': 15500  // Pack de 15,500 GolCoins
    };
     const packsVIP = {
    'R2JUTXC7BX4A2': true   // Rango VIP Mensual
    };

    // 1. SI ES COMPRA DE GOLCOINS
    if (packsMonedas[idBotonPayPal]) {
        const cantidadMonedasGanadas = packsMonedas[idBotonPayPal];
        const refMonedas = db.ref(`usuarios_futbol/${uid}/monedas`);

        await refMonedas.transaction((monedasActuales) => {
            return (monedasActuales || 0) + cantidadMonedasGanadas;
        });

        console.log(`¡Se acreditaron ${cantidadMonedasGanadas} GolCoins al usuario ${uid} con éxito!`);
        return res.status(200).send('IPN Validated Successfully for Coins');
    }

    // 2. SI ES COMPRA DE VIP
    else if (packsVIP[idBotonPayPal]) {
        const refVip = db.ref(`usuarios_futbol/${uid}/vip`);
        await refVip.set(true);

        console.log(`¡Estatus VIP activado con éxito para el usuario ${uid}!`);
        return res.status(200).send('IPN Validated Successfully for VIP');
    }

    // 3. SI NO ES NINGUNA DE LAS ANTERIORES, SIGUE TU CÓDIGO NORMAL DE ESCUDOS:

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
        },
        "juventus": {
          nombre: "Escudo Juventus",
          imagen: "imagenes escudos de clubes/juventus.png"
        },
        "roma": {
          nombre: "Escudo Roma",
          imagen: "imagenes escudos de clubes/roma.png"
        },
        "atalanta": {
          nombre: "Escudo Atalanta",
          imagen: "imagenes escudos de clubes/atalanta.png"
        },
        "lazio": {
          nombre: "Escudo Lazio",
          imagen: "imagenes escudos de clubes/lazio.png"
        },
        "como": {
          nombre: "Escudo Como",
          imagen: "imagenes escudos de clubes/como.png"
        },
        "udinese": {
          nombre: "Escudo Udinese",
          imagen: "imagenes escudos de clubes/udinese.png"
        },
        "sporting lisboa": {
          nombre: "Escudo Sporting Lisboa",
          imagen: "imagenes escudos de clubes/sporting.png"
        },
        "crystal palace": {
          nombre: "Escudo Crystal Palace",
          imagen: "imagenes escudos de clubes/crystalpalace.png"
        },
        "nottingham forest": {
          nombre: "Escudo Nottingham Forest",
          imagen: "imagenes escudos de clubes/nottingham.png"
        },
        "benfica": {
          nombre: "Escudo Benfica",
          imagen: "imagenes escudos de clubes/benfica.png"
        },
        "porto": {
          nombre: "Escudo Porto",
          imagen: "imagenes escudos de clubes/porto.png"
        },
        "arouca": {
          nombre: "Escudo Arouca",
          imagen: "imagenes escudos de clubes/arouca.png"
        },
        "brentford": {
          nombre: "Escudo Brentford",
          imagen: "imagenes escudos de clubes/brentford.png"
        },
        "leeds": {
          nombre: "Escudo Leeds",
          imagen: "imagenes escudos de clubes/leeds.png"
        },
        "everton": {
          nombre: "Escudo Everton",
          imagen: "imagenes escudos de clubes/everton.png"
        },
        "hull city": {
          nombre: "Escudo Hull City",
          imagen: "imagenes escudos de clubes/hullcity.png"
        },
        "newcastle": {
          nombre: "Escudo Newcastle",
          imagen: "imagenes escudos de clubes/newcastle.png"
        },
        "ipswich": {
          nombre: "Escudo Ipswich",
          imagen: "imagenes escudos de clubes/ipswich.png"
        },
        "sunderland": {
          nombre: "Escudo Sunderland",
          imagen: "imagenes escudos de clubes/sunderland.png"
        },
        "aston villa": {
          nombre: "Escudo Aston Villa",
          imagen: "imagenes escudos de clubes/astonvilla.png"
        },
        "tottenham": {
          nombre: "Escudo Tottenham",
          imagen: "imagenes escudos de clubes/tottenham.png"
        },
        "fulham": {
          nombre: "Escudo Fulham",
          imagen: "imagenes escudos de clubes/fulham.png"
        },
        "boca juniors": {
          nombre: "Escudo Boca Juniors",
          imagen: "imagenes escudos de clubes/boca.png"
        },
        "river plate": {
          nombre: "Escudo River Plate",
          imagen: "imagenes escudos de clubes/river.png"
        },
        "racing club": {
          nombre: "Escudo Racing Club",
          imagen: "imagenes escudos de clubes/racing.png"
        },
        "san lorenzo": {
          nombre: "Escudo San Lorenzo",
          imagen: "imagenes escudos de clubes/lorenzo.png"
        },
        "huracan": {
          nombre: "Escudo Huracan",
          imagen: "imagenes escudos de clubes/huracan.png"
        },
        "flamengo": {
          nombre: "Escudo Flamengo",
          imagen: "imagenes escudos de clubes/flamengo.png"
        },
        "fluminense": {
          nombre: "Escudo Fluminense",
          imagen: "imagenes escudos de clubes/fluminense.png"
        },
        "botafogo": {
          nombre: "Escudo Botafogo",
          imagen: "imagenes escudos de clubes/botafogo.png"
        },
        "corinthians": {
          nombre: "Escudo Corinthians",
          imagen: "imagenes escudos de clubes/corinthians.png"
        },
        "palmeiras": {
          nombre: "Escudo Palmeiras",
          imagen: "imagenes escudos de clubes/palmeiras.png"
        },
        "cruzeiro": {
          nombre: "Escudo Cruzeiro",
          imagen: "imagenes escudos de clubes/cruzeiro.png"
        },
        "vasco da gama": {
          nombre: "Escudo Vasco Da Gama",
          imagen: "imagenes escudos de clubes/gama.png"
        },
        "atletico mineiro": {
          nombre: "Escudo Atletico Mineiro",
          imagen: "imagenes escudos de clubes/mineiro.png"
        },
        "internacional": {
          nombre: "Escudo Internacional",
          imagen: "imagenes escudos de clubes/interna.png"
        },
        "sao paulo": {
          nombre: "Escudo São Paulo",
          imagen: "imagenes escudos de clubes/saopaulo.png"
        },
        "gremio": {
          nombre: "Escudo Gremio",
          imagen: "imagenes escudos de clubes/gremio.png"
        },
        "santos": {
          nombre: "Escudo Santos",
          imagen: "imagenes escudos de clubes/santos.png"
        },
        "barcelona sporting club": {
          nombre: "Escudo Barcelona Sporting Club",
          imagen: "imagenes escudos de clubes/bsc.png"
        },
        "club sport emelec": {
          nombre: "Escudo Club Sport Emelec",
          imagen: "imagenes escudos de clubes/cse.png"
        },
        "liga de quito": {
          nombre: "Escudo Liga De Quito",
          imagen: "imagenes escudos de clubes/quito.png"
        },
        "i.d.v": {
          nombre: "Escudo I.D.V",
          imagen: "imagenes escudos de clubes/idv.png"
        },
        "club america": {
          nombre: "Escudo América",
          imagen: "imagenes escudos de clubes/america.png"
        },
        "guadalajara": {
          nombre: "Escudo Guadalajara",
          imagen: "imagenes escudos de clubes/guadalajara.png"
        },
        "cruz azul": {
          nombre: "Escudo Cruz Azul",
          imagen: "imagenes escudos de clubes/cruzazul.png"
        },
        "pumas": {
          nombre: "Escudo Pumas",
          imagen: "imagenes escudos de clubes/pumas.png"
        },
        "tigres": {
          nombre: "Escudo Tigres",
          imagen: "imagenes escudos de clubes/tigres.png"
        },
        "toluca": {
          nombre: "Escudo Toluca",
          imagen: "imagenes escudos de clubes/toluca.png"
        },
        "monterrey": {
          nombre: "Escudo Monterrey",
          imagen: "imagenes escudos de clubes/monterrey.png"
        },
        "pachuca": {
          nombre: "Escudo Pachuca",
          imagen: "imagenes escudos de clubes/pachuca.png"
        },
        "atletico nacional": {
          nombre: "Escudo Atletico Nacional",
          imagen: "imagenes escudos de clubes/anacional.png"
        },
        "independiente": {
          nombre: "Escudo Independiente",
          imagen: "imagenes escudos de clubes/cai.png"
        },
        "deportivo cali": {
          nombre: "Escudo Deportivo Cali",
          imagen: "imagenes escudos de clubes/dcali.png"
        },
        "millonarios": {
          nombre: "Escudo Millonarios",
          imagen: "imagenes escudos de clubes/millo.png"
        },
        "santa fe": {
          nombre: "Escudo Santa Fe",
          imagen: "imagenes escudos de clubes/santafe.png"
        },
        "colo-colo": {
          nombre: "Escudo Colo-Colo",
          imagen: "imagenes escudos de clubes/colo.png"
        },
        "america de cali": {
          nombre: "Escudo América De Cali",
          imagen: "imagenes escudos de clubes/adc.png"
        },
        "universidad de chile": {
          nombre: "Escudo Universidad De Chile",
          imagen: "imagenes escudos de clubes/udc.png"
        },
        "universidad catolica": {
          nombre: "Escudo Universidad Católica",
          imagen: "imagenes escudos de clubes/ucatolica.png"
        },
        "peñarol": {
          nombre: "Escudo Peñarol",
          imagen: "imagenes escudos de clubes/peñarol.png"
        },
        "nacional": {
          nombre: "Escudo Nacional",
          imagen: "imagenes escudos de clubes/nacional.png"
        },
        "city torque": {
          nombre: "Escudo City Torque",
          imagen: "imagenes escudos de clubes/torque.png"
        },
        "everton vina mar": {
          nombre: "Escudo Everton V.D.M",
          imagen: "imagenes escudos de clubes/evertonvm.png"
        },
        "sporting cristal": {
          nombre: "Escudo Sporting Cristal",
          imagen: "imagenes escudos de clubes/sportingcr.png"
        },
        "alianza lima": {
          nombre: "Escudo Alianza Lima",
          imagen: "imagenes escudos de clubes/lima.png"
        },
        "universitario": {
          nombre: "Escudo Universitario",
          imagen: "imagenes escudos de clubes/universitario.png"
        },
        "metropolitanos": {
          nombre: "Escudo Metropolitanos",
          imagen: "imagenes escudos de clubes/metro.png"
        },
        "deportivo tachira": {
          nombre: "Escudo Deportivo Táchira",
          imagen: "imagenes escudos de clubes/tachira.png"
        },
        "cienciano": {
          nombre: "Escudo Cienciano",
          imagen: "imagenes escudos de clubes/cienciano.png"
        },
        "caracas": {
          nombre: "Escudo Caracas",
          imagen: "imagenes escudos de clubes/caracasfc.png"
        },
        "portugesa": {
          nombre: "Escudo Portugesa",
          imagen: "imagenes escudos de clubes/portugesa.png"
        },
        "bolivar": {
          nombre: "Escudo Bolívar",
          imagen: "imagenes escudos de clubes/bolivar.png"
        },
        "real potosi": {
          nombre: "Escudo Real Potosí",
          imagen: "imagenes escudos de clubes/potosi.png"
        },
        "blooming": {
          nombre: "Escudo Blooming",
          imagen: "imagenes escudos de clubes/blooming.png"
        },
        "olimpia": {
          nombre: "Escudo Olimpia",
          imagen: "imagenes escudos de clubes/olimpia.png"
        },
        "2 de mayo": {
          nombre: "Escudo 2 De Mayo",
          imagen: "imagenes escudos de clubes/dmayo.png"
        },
        "libertad": {
          nombre: "Escudo Libertad",
          imagen: "imagenes escudos de clubes/libertad.png"
        },
        "cerro porteno": {
          nombre: "Escudo Cerro Porteño",
          imagen: "imagenes escudos de clubes/porteño.png"
        },
        "sportivo trinidense": {
          nombre: "Escudo Sportivo Trinidense",
          imagen: "imagenes escudos de clubes/trinidense.png"
        },
        "sportivo ameliano": {
          nombre: "Escudo Sportivo Ameliano",
          imagen: "imagenes escudos de clubes/ameliano.png"
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
    
      res.status(200).send('IPN Validated Successfully');
    } else {
      console.warn('¡Alerta! IPN no verificado detectado por PayPal.');
      res.status(400).send('Invalid IPN');
    }

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
