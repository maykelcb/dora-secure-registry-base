# RAHU - Red de asistencia humanitaria

RAHU es una aplicación web privada y segura para el registro y gestión de documentos de personas de interés (refugiados, solicitantes de asilo, migrantes), basada en los estándares de categorización documental de ACNUR.

## Características Principales

- 🔒 **100% Offline y Seguro**: Sin backend. Todos los datos se guardan en el almacenamiento local del navegador (`localStorage`).
- 🔐 **Encriptación de Grado Militar**: Se utiliza **AES-256** para cifrar toda la base de datos. La clave de cifrado se deriva de la contraseña maestra del usuario utilizando **PBKDF2** (con *salt* aleatorio).
- 🛡️ **Integridad de Datos**: Cada registro tiene un checksum **SHA-256** para detectar si el almacenamiento ha sido manipulado directamente.
- ⚡ **Rápido y Moderno**: Construido con React 18, Vite, Zustand y Tailwind CSS.
- 📊 **Gestión Completa**: CRUD de documentos, alertas de vencimiento automático (30 y 7 días), métricas en tiempo real.
- 📥 **Exportación**: Soporte nativo para exportar registros filtrados a Excel (.xlsx) y CSV.

## Arquitectura de Seguridad

1. Al inicializar la aplicación, el usuario crea una "Contraseña Maestra".
2. A partir de esa contraseña y un salt aleatorio, se genera una Clave de Encriptación (DEK).
3. El DEK solo existe en la memoria RAM durante la sesión activa.
4. Cada vez que se guarda un documento, toda la base de datos se cifra con AES-256 antes de guardarse en `localStorage`.
5. Existe un tiempo de inactividad (timeout) que destruye el DEK de la memoria, requiriendo iniciar sesión nuevamente.
6. Si la contraseña se pierde, **los datos son criptográficamente irrecuperables**. Por ello se recomienda usar la opción de exportar copias de seguridad (.json).

## Instrucciones para el Desarrollo Local

1. Clona el repositorio.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Despliegue en Netlify

El proyecto está configurado para desplegarse fácilmente como un sitio estático (SPA).

1. Sube el código a GitHub.
2. Conecta el repositorio a Netlify.
3. El comando de construcción es `npm run build` y el directorio de publicación es `dist`.
4. El archivo `netlify.toml` ya incluye las reglas de redirección para que funcione el enrutamiento de React (`React Router`).

---
**Nota**: El diseño y la estructura cumplen estrictamente con los protocolos y tipos de documentos requeridos para la gestión de casos.
