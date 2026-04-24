const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')

const getExecutablePath = () => {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (process.platform === 'win32') return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (process.platform === 'darwin') return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (process.platform === 'linux') return '/usr/bin/google-chrome';
  return undefined;
};

const QRPortalWeb = require('@bot-whatsapp/portal')
const WWebJSProvider = require('@bot-whatsapp/provider/web-whatsapp')
const MockAdapter = require('@bot-whatsapp/database/mock')

const flowPrincipal = addKeyword(['hola', 'ole', 'alo'])
  .addAnswer('🙌 Hola bienvenido a este *Chatbot*')
  .addAnswer('¡¿Cómo puedo ayudarte? 😊')

const flowWelcome = addKeyword(EVENTS.WELCOME)
  .addAnswer('Hola 👋. ¿En qué puedo ayudarte?')

const flowMedia = addKeyword(EVENTS.MEDIA)
  .addAnswer(
    '📎 Recibí tu archivo multimedia. En breve lo procesaré.',
    null,
    async (ctx) => {
      console.log('Archivo recibido:', ctx.type);
    }
  );

const flowLocation = addKeyword(EVENTS.LOCATION)
  .addAnswer(
    '📍 Recibí tu ubicación. En breve lo procesaré.',
    null,
    async (ctx) => {
      try {
        const location = ctx?.location || ctx?._data;
        const lat = location?.lat || location?.degreesLatitude;
        const lng = location?.lng || location?.degreesLongitude;

        console.log('Ubicación recibida:', { lat, lng });
      } catch (err) {
        console.error('Error en flowLocation:', err);
      }
    }
  );

const flowDocument = addKeyword(EVENTS.DOCUMENT)
  .addAnswer(
    '📄 Recibí tu documento. En breve lo procesaré.',
    null,
    async (ctx) => {
      try {
        const document = ctx?._data || ctx?.message?.documentMessage;
        console.log('Documento recibido:', document?.filename || document?.fileName);
      } catch (err) {
        console.error('Error en flowDocument:', err);
      }
    }
  );

const flowVoiceNote = addKeyword(EVENTS.VOICE_NOTE)
  .addAnswer(
    '🎤 Recibí tu nota de voz. En breve lo procesaré.',
    null,
    async (ctx) => {
      try {
        console.log('Nota de voz recibida');
      } catch (err) {
        console.error('Error en flowVoiceNote:', err);
      }
    }
  );

const flowAction = addKeyword(EVENTS.ACTION)
  .addAnswer('🚨 Este mensaje fue generado automáticamente por el sistema.');


const fetch = require('node-fetch');
const flowDynamic = addKeyword(['clima', 'tiempo', 'weather'])
  .addAnswer(
    '🌐 Consultando el clima actual...',
    null,
    async (ctx, { flowDynamic }) => {
      const message = ctx.body.toLowerCase();

      if (message.includes('clima')) {
        try {
          const city = 'Buenos Aires';
          const url = `https://wttr.in/${city}?format=j1`;

          const response = await fetch(url);
          const data = await response.json();

          const current = data.current_condition[0];
          const temperature = current.temp_C;
          const description = current.weatherDesc[0].value;

          await flowDynamic(
            `🌤️ El clima actual en ${city} es ${description}, con una temperatura de ${temperature}°C.`
          );
        } catch (error) {
          await flowDynamic(
            '⚠️ Ocurrió un error al consultar el clima. Intentá nuevamente más tarde.'
          );
        }
      } else {
        await flowDynamic(
          '🤔 Podés preguntarme por el clima actual. Por ejemplo: "¿Cómo está el clima hoy?"'
        );
      }
    }
  )


const main = async () => {
  const adapterDB = new MockAdapter()
  const adapterFlow = createFlow([flowPrincipal, flowWelcome, flowMedia, flowLocation, flowDocument, flowVoiceNote, flowAction, flowDynamic])
  const adapterProvider = createProvider(WWebJSProvider, {
    puppeteer: {
      executablePath: getExecutablePath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  })

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  })

  setTimeout(async () => {
    await adapterProvider.sendText(
      '5493435197408@s.whatsapp.net',
      '🚨🚨🚨 Mensaje ACTION de prueba'
    );
  }, 20000);

  QRPortalWeb()
}

main()
