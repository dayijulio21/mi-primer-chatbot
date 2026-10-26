
import express from "express";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const API_VERSION = process.env.GRAPH_API_VERSION;

// Chatbot exclusivo del emprendimiento ANTOJITOS.
function responder(mensaje) {
  const texto = mensaje
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches)$/.test(texto)) {
    return "¡Hola! 🥟💚 Bienvenido/a a ANTOJITOS.\n\nSomos un emprendimiento de pasabocas bajo pedido.\n\nPuedes preguntarme sobre:\n1. Nuestros productos\n2. Precios\n3. Cómo hacer un pedido\n4. Disponibilidad\n\n¿Qué te gustaría saber?";
  }

  if (/producto|menu|que venden|que ofrecen|pasabocas/.test(texto)) {
    return "En ANTOJITOS ofrecemos deditos de queso, empanadas, salchirollos y productos de maíz. 🥟🌽\n\nNuestros productos se manejan bajo pedido. Dime cuál te interesa para orientarte.";
  }

  if (/precio|precios|cuanto cuesta|cuanto vale|valor|tarifa/.test(texto)) {
    return "💚 ¡Con gusto te orientamos con los precios de ANTOJITOS! Dime qué producto deseas y qué cantidad necesitas. Así podremos indicarte el precio correspondiente.";
  }

  if (/pedido|pedir|comprar|encargar|reservar/.test(texto)) {
    return "¡Qué alegría que quieras comprar en ANTOJITOS! 💚🥟\n\nPara orientarte con tu pedido, cuéntame:\n• ¿Qué producto deseas?\n• ¿Cuántas unidades o bandejas necesitas?\n• ¿Para qué fecha lo necesitas?";
  }

  if (/disponible|disponibilidad|hay bandejas|stock|existencia/.test(texto)) {
    return "🥟 Nuestros productos se preparan o gestionan bajo pedido. Para confirmar la disponibilidad actual de una bandeja, necesitamos verificarla antes de darte una respuesta. ¿Qué producto te interesa?";
  }

  if (/entrega|domicilio|envio|envios|recoger/.test(texto)) {
    return "💚 Gracias por consultar con ANTOJITOS. Para informarte sobre entregas o recogidas, necesitamos confirmar la cobertura y las condiciones de tu pedido. ¿Qué producto deseas?";
  }

  if (/persona|asesor|contacto|atencion|hablar con alguien/.test(texto)) {
    return "¡Claro! 💚 Cuéntanos qué necesitas para que podamos ayudarte con tu pedido de ANTOJITOS.";
  }

  if (/gracias|muchas gracias/.test(texto)) {
    return "¡Gracias a ti por elegir ANTOJITOS! 🥟💚 ¡Será un gusto atender tu pedido!";
  }

  return "💚 Soy el asistente virtual de ANTOJITOS y solo puedo ayudarte con información de nuestro emprendimiento: productos, precios, disponibilidad y pedidos.\n\n¿Qué deseas consultar sobre ANTOJITOS? 🥟";
}

// Verificación del webhook de WhatsApp.
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Recepción y respuesta a mensajes de WhatsApp.
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    for (const entrada of req.body.entry || []) {
      for (const cambio of entrada.changes || []) {
        const datos = cambio.value;
        if (!datos.messages) continue;

        for (const mensaje of datos.messages) {
          if (mensaje.type !== "text") continue;

          const respuesta = responder(mensaje.text?.body || "");
          const url =
            `https://graph.facebook.com/${API_VERSION}/` +
            `${PHONE_NUMBER_ID}/messages`;

          const resultado = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ACCESS_TOKEN}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: mensaje.from,
              type: "text",
              text: { body: respuesta }
            })
          });

          if (!resultado.ok) {
            console.error("Error de WhatsApp:", await resultado.text());
          }
        }
      }
    }
  } catch (error) {
    console.error("Error procesando el mensaje:", error);
  }
});

app.get("/", (req, res) => {
  res.send("Asistente virtual de ANTOJITOS activo 🥟");
});

app.listen(PORT, () => {
  console.log(`Chatbot de ANTOJITOS activo en el puerto ${PORT}`);
});
