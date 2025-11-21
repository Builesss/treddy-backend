# Treddy Backend 🎨

Backend API para **Treddy**, una plataforma de e-commerce de figuras 3D personalizables con realidad aumentada (AR). Construido con Node.js, Express, TypeScript y Prisma ORM.

---

## 🚀 Características

- **Autenticación Multi-Proveedor**: Login tradicional, Google OAuth, Microsoft OAuth
- **Gestión de Productos**: CRUD completo de figuras 3D con personalización
- **Carrito de Compras**: Sistema de carrito con soporte para usuarios autenticados y sesiones anónimas
- **Pagos**: Integración con MercadoPago para procesamiento de pagos
- **Almacenamiento en la Nube**: Google Cloud Storage para modelos 3D, imágenes y vistas AR
- **Webhooks**: Manejo de notificaciones de MercadoPago
- **Documentación API**: Swagger UI interactivo
- **Testing**: Cobertura completa de tests unitarios con Jest
- **Seguridad**: Helmet, CORS, bcrypt para contraseñas, JWT para autenticación

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 20.x
- **npm** >= 9.x
- **PostgreSQL** >= 15.x
- **Git**

### Cuentas de Servicios Externos (Opcional)

- Cuenta de Google Cloud Platform (para Google Cloud Storage)
- Cuenta de MercadoPago (para pagos)
- OAuth Apps configuradas en Google y Microsoft

---

## ⚙️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://ADSO211@dev.azure.com/ADSO211/Treddy/_git/treddy-backend
cd treddy-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales. Ver sección [Variables de Entorno](#-variables-de-entorno) para más detalles.

### 4. Configurar la base de datos

```bash
# Generar el cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# (Opcional) Poblar la base de datos con datos de prueba
npx prisma db seed
```

### 5. Iniciar el servidor

**Desarrollo:**

```bash
npm run dev
```

**Producción:**

```bash
npm run build
npm start
```

El servidor estará corriendo en `http://localhost:4000`

---

## 🔐 Variables de Entorno

Crea un archivo `.env` con las siguientes variables:

| Variable                   | Descripción                               | Ejemplo                                        |
| -------------------------- | ----------------------------------------- | ---------------------------------------------- |
| `NODE_ENV`                 | Entorno de ejecución                      | `development` o `production`                   |
| `PORT`                     | Puerto del servidor                       | `4000`                                         |
| `DATABASE_URL`             | URL de conexión a PostgreSQL              | `postgresql://user:pass@localhost:5432/treddy` |
| `JWT_SECRET`               | Secreto para firmar tokens JWT            | `tu_secreto_super_seguro_aqui`                 |
| `SESSION_SECRET`           | Secreto para sesiones de Express          | `otra_clave_secreta_aqui`                      |
| `GOOGLE_CLIENT_ID`         | Client ID de Google OAuth                 | `123456789.apps.googleusercontent.com`         |
| `GOOGLE_CLIENT_SECRET`     | Client Secret de Google OAuth             | `GOCSPX-xxxxx`                                 |
| `MICROSOFT_CLIENT_ID`      | Client ID de Microsoft OAuth              | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`         |
| `MICROSOFT_CLIENT_SECRET`  | Client Secret de Microsoft OAuth          | `xxxxx~xxxxx`                                  |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de acceso de MercadoPago            | `APP_USR-xxxxx`                                |
| `GCS_BUCKET_NAME`          | Nombre del bucket de Google Cloud Storage | `treddy-storage`                               |
| `GCS_PROJECT_ID`           | ID del proyecto de Google Cloud           | `treddy-project-123456`                        |
| `FRONTEND_URL`             | URL del frontend para CORS                | `http://localhost:3000`                        |

> [!IMPORTANT] > **Nunca** subas el archivo `.env` al repositorio. Está incluido en `.gitignore` por seguridad.

Ver el archivo [`.env.example`](.env.example) para una plantilla completa.

---

## 📜 Scripts Disponibles

| Comando            | Descripción                                          |
| ------------------ | ---------------------------------------------------- |
| `npm run dev`      | Inicia el servidor en modo desarrollo con hot-reload |
| `npm run build`    | Compila TypeScript a JavaScript en `/dist`           |
| `npm start`        | Inicia el servidor en modo producción                |
| `npm test`         | Ejecuta todos los tests con Jest                     |
| `npm run test:cov` | Ejecuta tests y genera reporte de cobertura          |

---

## 📁 Estructura del Proyecto

```
treddy-backend/
├── src/
│   ├── config/           # Configuración (Passport, Database)
│   ├── controllers/      # Controladores de rutas
│   ├── middlewares/      # Middlewares personalizados
│   ├── routes/           # Definición de rutas
│   ├── services/         # Lógica de negocio
│   ├── generated/        # Cliente de Prisma generado
│   ├── app.ts            # Configuración de Express
│   ├── index.ts          # Punto de entrada
│   └── swagger.ts        # Configuración de Swagger
├── tests/                # Tests unitarios
├── prisma/
│   ├── schema.prisma     # Esquema de base de datos
│   └── migrations/       # Migraciones de Prisma
├── coverage/             # Reportes de cobertura de tests
├── dist/                 # Código compilado (generado)
├── Dockerfile            # Configuración de Docker
├── .env                  # Variables de entorno (NO subir a git)
├── .env.example          # Plantilla de variables de entorno
├── package.json          # Dependencias y scripts
└── tsconfig.json         # Configuración de TypeScript
```

---

## 🌐 API Endpoints

### Documentación Interactiva

Una vez iniciado el servidor, accede a la documentación completa de la API en:

**Swagger UI**: [http://localhost:4000/api-docs](http://localhost:4000/api-docs)

### Principales Endpoints

#### 🔐 Autenticación (`/api/auth`)

- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil (requiere JWT)
- `GET /api/auth/google` - Login con Google
- `GET /api/auth/microsoft` - Login con Microsoft

#### 🛒 Carrito (`/api/cart`)

- `GET /api/cart` - Obtener carrito actual
- `POST /api/cart/items` - Agregar producto al carrito
- `PATCH /api/cart/items/:productoId` - Actualizar cantidad
- `DELETE /api/cart/items/:productoId` - Eliminar producto
- `DELETE /api/cart` - Vaciar carrito
- `POST /api/cart/merge-session` - Unir carrito de sesión con usuario

#### 🎨 Figuras/Productos (`/api/figuras`)

- `GET /api/figuras` - Listar todos los productos
- `GET /api/figuras/:id` - Obtener producto por ID
- `POST /api/figuras` - Crear nuevo producto
- `PUT /api/figuras/:id` - Actualizar producto
- `DELETE /api/figuras/:id` - Eliminar producto

#### 💳 Pagos (`/api/payment`)

- `POST /api/payment/create-preference` - Crear preferencia de pago
- `POST /api/payment/webhook` - Webhook de MercadoPago

#### 👤 Usuarios (`/api/user`)

- `GET /api/user/:id` - Obtener usuario por ID
- `PUT /api/user/:id` - Actualizar usuario

#### ☁️ Google Cloud Storage (`/api/gcs`)

- `POST /api/gcs/upload` - Subir archivo
- `GET /api/gcs/files` - Listar archivos
- `DELETE /api/gcs/delete/:filename` - Eliminar archivo

---

## 🧪 Testing

El proyecto cuenta con una cobertura de tests del **~100%** en servicios críticos.

### Ejecutar tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con reporte de cobertura
npm run test:cov

# Ver reporte de cobertura en HTML
# Abre: coverage/lcov-report/index.html
```

### Estructura de Tests

```
tests/
├── auth.test.ts       # Tests de autenticación
├── cart.test.ts       # Tests del carrito
├── figuras.test.ts    # Tests de productos
├── gcs.test.ts        # Tests de Google Cloud Storage
├── payment.test.ts    # Tests de pagos
├── users.test.ts      # Tests de usuarios
└── webhook.test.ts    # Tests de webhooks
```

---

## 🐳 Docker

### Construir imagen

```bash
docker build -t treddy-backend .
```

### Ejecutar contenedor

```bash
docker run -p 4000:4000 --env-file .env treddy-backend
```

### Docker Compose (Recomendado)

```bash
# Iniciar todos los servicios (backend + PostgreSQL)
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

---

## 🔒 Seguridad

- **Helmet**: Protección de headers HTTP
- **CORS**: Configurado para orígenes específicos
- **bcrypt**: Hash de contraseñas con salt rounds
- **JWT**: Tokens firmados para autenticación
- **express-validator**: Validación de inputs
- **Prisma**: Prevención de SQL Injection

### Recomendaciones de Seguridad

- [ ] Cambiar `JWT_SECRET` y `SESSION_SECRET` en producción
- [ ] Habilitar HTTPS en producción
- [ ] Configurar rate limiting (ver mejoras recomendadas)
- [ ] Revisar permisos de Google Cloud Storage
- [ ] Implementar refresh tokens para JWT

---

## 🚀 Deployment

### Preparación para Producción

1. **Variables de entorno**: Configura todas las variables en tu plataforma de hosting
2. **Base de datos**: Asegúrate de tener PostgreSQL configurado
3. **Build**: Ejecuta `npm run build`
4. **Migraciones**: Ejecuta `npx prisma migrate deploy`
5. **Inicio**: Ejecuta `npm start`

### Plataformas Recomendadas

- **Railway**: Deploy automático desde Git
- **Render**: Soporte nativo para Node.js + PostgreSQL
- **Heroku**: Con add-on de PostgreSQL
- **Azure App Service**: Integración con Azure DevOps
- **AWS EC2/ECS**: Para mayor control

---

## 🤝 Contribuir

### Workflow de Desarrollo

1. Crea una rama desde `develop`:

   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

2. Realiza tus cambios y commits:

   ```bash
   git commit -m "feat: descripción del cambio"
   ```

3. Ejecuta los tests:

   ```bash
   npm run test:cov
   ```

4. Push y crea un Pull Request:
   ```bash
   git push origin feature/nueva-funcionalidad
   ```

### Convenciones de Código

- **TypeScript**: Tipado estricto habilitado
- **ESLint**: Seguir las reglas configuradas
- **Commits**: Usar [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` Nueva funcionalidad
  - `fix:` Corrección de bug
  - `docs:` Cambios en documentación
  - `test:` Agregar o modificar tests
  - `refactor:` Refactorización de código

---

## 📚 Tecnologías Utilizadas

### Core

- **Node.js** 20.x
- **TypeScript** 5.x
- **Express** 5.x
- **Prisma ORM** 6.x
- **PostgreSQL** 15.x

### Autenticación

- **Passport.js** (Google, Microsoft, JWT)
- **bcrypt** (Hash de contraseñas)
- **jsonwebtoken** (JWT)

### Servicios Externos

- **MercadoPago SDK** (Pagos)
- **Google Cloud Storage** (Almacenamiento)

### Seguridad & Middleware

- **Helmet** (Seguridad HTTP)
- **CORS** (Control de acceso)
- **express-validator** (Validación)
- **morgan** (Logging HTTP)
- **compression** (Compresión de respuestas)

### Testing

- **Jest** (Framework de testing)
- **ts-jest** (TypeScript para Jest)

### Documentación

- **Swagger UI Express** (Documentación interactiva)
- **swagger-jsdoc** (Generación de specs)

---

## 📞 Soporte

Para preguntas o problemas:

- **Repositorio**: [Azure DevOps - Treddy Backend](https://dev.azure.com/ADSO211/Treddy/_git/treddy-backend)
- **Issues**: Crea un issue en Azure DevOps
- **Documentación API**: [http://localhost:4000/api-docs](http://localhost:4000/api-docs)

---

## 📄 Licencia

ISC License - Ver archivo LICENSE para más detalles.

---

## 🎯 Roadmap

- [ ] Implementar rate limiting
- [ ] Agregar sistema de logging con Winston
- [ ] Implementar CI/CD con GitHub Actions
- [ ] Agregar health checks
- [ ] Implementar caching con Redis
- [ ] Migrar a arquitectura de microservicios
- [ ] Agregar tests E2E

---

**Desarrollado con ❤️ por el equipo de Treddy**
