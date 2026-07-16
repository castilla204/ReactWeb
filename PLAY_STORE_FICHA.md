# Ficha de Play Store — Inspecciono

Redactado a partir del análisis del código (ROADMAP.md, AndroidManifest.xml, package.json, capacitor.config.ts) y de los metadatos públicos de https://inspecciono.com.

## Datos básicos
- **Nombre:** Inspecciono
- **Paquete:** com.inspecciono.app
- **Categoría sugerida:** Estilo de vida (alternativa: Casa y hogar / Negocios)
- **Sitio web:** https://inspecciono.com
- **Idioma principal:** Español (España)

## Descripción corta (≤80 caracteres)
"Antes de comprar, que un experto verificado lo revise por ti."

## Descripción completa (≤4000 caracteres)
¿Vas a comprar un coche, un piso o una moto de segunda mano? Con Inspecciono, un perito verificado se desplaza, lo inspecciona a fondo y te entrega un informe detallado antes de que tomes la decisión de compra.

**Cómo funciona:**
1. Publica lo que necesitas inspeccionar (coche, vivienda, moto u otro producto) y dónde.
2. Elige entre los expertos verificados disponibles en tu zona y contrata el servicio.
3. El perito se desplaza, realiza la inspección y sube un informe completo con fotos.
4. Revisas el informe y decides. El pago queda retenido (escrow) y solo se libera al experto cuando das tu visto bueno.

**Funciones principales:**
- Red de peritos y expertos verificados por categoría (vehículos, vivienda, motos y otros productos).
- Gestión de citas: propuesta, aceptación/rechazo y seguimiento del estado de cada inspección.
- Chat en tiempo real con el experto, con envío de fotos y archivos.
- Pago seguro con retención (Stripe): no se libera el pago hasta que apruebas el informe.
- Notificaciones push con el estado de tu inspección.
- Panel para expertos: gestión de citas, subida de informes y cobros.

Inspecciono está pensado tanto para compradores particulares que quieren evitar sorpresas antes de una compra de segunda mano, como para profesionales que ofrecen servicios de inspección y quieren encontrar clientes.

## Política de privacidad
- URL a declarar en Play Console: **https://inspecciono.com/legal/privacy**
  (Nota: al comprobar la web en vivo, la página cargó en blanco en esta sesión — antes de enviar la app a revisión, confirma manualmente que esa URL carga el texto legal correctamente; Google la revisa.)
- Responsable: Inspecciono (verificar razón social/NIF exactos para el pie de la política antes de publicar).

## Cuestionario de seguridad de datos (borrador, basado en el código)
Tipos de datos que la app recoge y por qué (a confirmar/ajustar en el formulario oficial):

| Categoría | ¿Se recoge? | Motivo | Notas |
|---|---|---|---|
| Nombre | Sí | Funcionalidad de la app / cuenta | Registro y perfil de usuario/experto |
| Correo electrónico | Sí | Funcionalidad de la app / cuenta | Login (email, Google, Apple vía @capgo/capacitor-social-login) |
| Número de teléfono | Sí | Funcionalidad de la app | Hay verificación por teléfono (PhoneVerificationPage) |
| Dirección | Sí | Funcionalidad de la app | Ubicación del objeto a inspeccionar (dirección introducida manualmente, no GPS) |
| Ubicación aproximada/precisa del dispositivo | No | — | El AndroidManifest solo pide INTERNET y POST_NOTIFICATIONS; no hay permiso de localización nativo |
| Fotos | Sí | Funcionalidad de la app | Informes de inspección y chat (adjuntos) |
| Mensajes (chat en la app) | Sí | Funcionalidad de la app | Chat en tiempo real usuario-experto (SignalR) |
| Información de pago | Sí (vía Stripe) | Procesamiento de pagos | Stripe Checkout/Connect; Inspecciono no debería almacenar el número de tarjeta completo |
| Identificadores del dispositivo / de la app | Sí | Notificaciones push | Firebase Cloud Messaging (@capacitor-firebase/messaging) |
| Actividad en la app | Probable | Analítica/funcionamiento | Revisar si hay analítica de terceros antes de confirmar |

Todos los datos personales listados deberían marcarse como **cifrados en tránsito** (HTTPS/API) y habría que confirmar si el usuario puede solicitar borrado de cuenta y datos (revisar `AccountDeletionModal.tsx` / `ACCOUNT_DELETION_USAGE.md`, ya existen en el proyecto) — Play Console pregunta explícitamente si se ofrece un mecanismo de eliminación de cuenta/datos.

## Clasificación de contenido (borrador)
- Categoría del cuestionario IARC: **Utilidades / Estilo de vida / Compras** (no es un juego).
- No hay contenido violento, sexual, apuestas ni generado por usuarios de forma pública (el chat es privado 1 a 1 entre cliente y experto contratado).
- Clasificación esperada: **PEGI 3 / Apto para todos los públicos**.

## Público objetivo
- Recomendado: **18 años en adelante**, dado que la app implica contratación de servicios y pagos (transacciones económicas, cuentas de experto/profesional). Esto se puede ajustar en el formulario si se decide permitir menores con supervisión.

## Pendiente antes de poder publicar
1. AAB de release firmado (bloqueado: sin keystore, sin entorno para compilar ahora mismo).
2. Icono 512×512 y feature graphic 1024×500 (puedo generarlos desde el SVG subido en cuanto se recupere el entorno de compilación de imágenes).
3. Al menos 2 capturas de pantalla del teléfono.
4. Confirmar que la URL de política de privacidad carga correctamente en producción.
5. Confirmar razón social/NIF del responsable de datos para la política de privacidad.
