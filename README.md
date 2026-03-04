# Wingx - Sistema de Gestión para Talleres de Costura

![Next.js](https://img.shields.io/badge/Next.js_15+-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

Wingx es una aplicación web moderna y robusta diseñada para transformar la gestión de talleres de costura y confección. Ofrece una solución integral para controlar inventario, pedidos, clientes y producción, todo envuelto en una interfaz de usuario premium y responsiva.

## 🚀 Características Principales

### � Experiencia de Usuario (UX/UI)

* **Diseño Premium**: Interfaz moderna con efectos "Glassmorphism", animaciones suaves y una paleta de colores cuidada.
* **Responsividad Total**: Optimizado para funcionar perfectamente en móviles, tablets y escritorios.
* **Modo Oscuro/Claro**: Adaptable a las preferencias del usuario.

### 🏭 Gestión Integral del Taller

* **Gestión de Pedidos**: Ciclo de vida completo (Sin comenzar, Pendiente, En proceso, Entregado) con control visual de estados.
* **Catálogo de Prendas**: Definición detallada de productos, incluyendo cálculo de costos, materiales y precios sugeridos.
* **Inventario (Stock)**: Control en tiempo real de productos terminados disponibles para entrega inmediata.
* **Gestión de Materiales y Compras**: Listas automáticas de insumos necesarios para la producción.
* **Base de Datos de Clientes**: Historial de pedidos, información de contacto y métricas por cliente.
* **Agenda Interactiva**: Calendario visual para organizar entregas y plazos de producción.

### � Seguridad y Multiusuario

* **Autenticación Robusta**: Sistema de login seguro.
* **Aislamiento de Datos**: Arquitectura diseñada para que cada taller ("Owner") gestione sus datos de forma privada e independiente.
* **Roles y Permisos**: Distinción clara entre usuarios estándar y administradores.

### 💰 Finanzas y Administración

* **Tasa de Cambio Global**: Widget inteligente para conversión de precios (Bs/USD) en tiempo real en toda la app.
* **Dashboard Administrativo**: Visión de pájaro con estadísticas clave, usuarios activos y métricas de rendimiento.
* **Reportes**: Generación de resúmenes de actividad.

## 🛠️ Stack Tecnológico

* **Core**: [Next.js 15+](https://nextjs.org/) (App Router), React 19.
* **Lenguaje**: TypeScript para un código tipado y seguro.
* **Estilos**: [Tailwind CSS 4](https://tailwindcss.com/) con enfoque en diseño utility-first.
* **Backend & DB**: [Firebase](https://firebase.google.com/) (Firestore, Authentication, Storage).
* **UI Components**: Iconos por [Lucide React](https://lucide.dev/), notificaciones con [Sonner](https://sonner.emilkowal.ski/).
* **Utilidades**: [Date-fns](https://date-fns.org/) para manipulación de fechas.

## 📂 Estructura del Proyecto

```bash
/src
├── /app                 # Rutas de la aplicación (App Router)
│   ├── /agenda          # Calendario de pedidos
│   ├── /clientes        # Gestión de clientes
│   ├── /inventario      # Inventario de Stock
│   ├── /materiales      # Gestión de insumos
│   ├── /pedidos         # Flujo de pedidos
│   ├── /prendas         # Catálogo de prendas
│   ├── layout.tsx       # Shell principal
│   └── page.tsx         # Dashboard
├── /components          # Biblioteca de componentes UI
│   ├── /dashboard       # Widgets del dashboard
│   ├── Shell            # Layout container
│   ├── Sidebar          # Navegación
│   └── ...              # Componentes reutilizables (Forms, Badges, etc.)
├── /context             # Estados globales (Auth, Orders, Clients, etc.)
├── /hooks               # Custom Hooks (useDebounce, etc.)
├── /lib                 # Configuración de Firebase
└── /services            # Lógica de negocio y persistencia
```

## 🏁 Instalación y configuración

1. **Clonar el repositorio**

    ```bash
    git clone https://github.com/tu-usuario/wingx.git
    cd wingx
    ```

2. **Instalar dependencias**

    ```bash
    npm install
    ```

3. **Configurar Variables de Entorno**
    Crea un archivo `.env.local` en la raíz del proyecto con tus credenciales de Firebase:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...
    ```

4. **Ejecutar el servidor de desarrollo**

    ```bash
    npm run dev
    ```

5. **Abrir en el navegador**
    Visita [http://localhost:3000](http://localhost:3000).

## 🚢 Despliegue

La aplicación está optimizada para ser desplegada en [Vercel](https://vercel.com), la plataforma de los creadores de Next.js.
