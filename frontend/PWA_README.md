# Macanudos - WebApp

## 🚀 Cómo usar como WebApp

### Desarrollo
```bash
cd frontend
npm run dev
```

### Build para producción (con PWA)
```bash
cd frontend
npm run build
```

Los archivos generados estarán en `frontend/dist/`

### Despliegue
- **Firebase Hosting**: Copia el contenido de `frontend/dist/` a `frontend/` (o configúralo directamente en firebase.json)
- **Vercel**: Vercel detecta automáticamente el build y despliega como PWA
- **Netlify**: Configura el directorio de publicación a `frontend/dist`

## 📱 Instalación como App

1. Abre la app en un navegador compatible (Chrome, Edge, Safari)
2. Busca el botón de instalación en la barra de dirección
3. Haz clic en "Instalar Macanudos"
4. La app se instalará en tu dispositivo y podrás ejecutarla a pantalla completa

## ✨ Características PWA

- ✅ Ejecución a pantalla completa (sin URL)
- ✅ Instalable en el dispositivo
- ✅ Funciona offline (caching inteligente)
- ✅ Iconos personalizados
- ✅ Modo portrait optimizado para móviles
- ✅ Actualizaciones automáticas en segundo plano

## 🔧 Configuración

- **Manifest**: Configurado en `vite.config.js`
- **Service Worker**: Generado automáticamente por `vite-plugin-pwa`
- **Caching**: Estrategia NetworkFirst para APIs, CacheFirst para assets estáticos
