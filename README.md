# EstaPark POS — Instalación PWA en Tablet

Este documento describe los pasos para desplegar e instalar la Progressive Web App (PWA) "EstaPark POS" en una tablet (Android / iPad).

## Requisitos
- Servidor HTTPS (recomendado) o `localhost` para pruebas.
- Acceso a la tablet y permiso para instalar apps web (Chrome o navegador compatible).
- Asegúrate de que `manifest.json`, `sw.js` y los iconos estén accesibles en el servidor.

## Archivos clave
- `manifest.json` — configuración PWA (display: `standalone`).
- `sw.js` — service worker con cache-first para assets locales.
- `js/html5-qrcode.min.js` — librería local para escaneo offline.

## Pasos para desplegar
1. Subir los archivos del proyecto al servidor HTTPS.
2. Verificar que `manifest.json` esté en la raíz accesible (`https://tu-sitio/manifest.json`).
3. Verificar que `sw.js` esté en la raíz accesible (`https://tu-sitio/sw.js`).
4. Asegurarse de que los iconos existen en `./icons/icon-192.png` y `./icons/icon-512.png`.

## Instalación en tablet Android (Chrome)
1. Abre Chrome e ingresa la URL de la app (ej. `https://intranet.cinesunidos/estapark/`).
2. Permite los permisos que solicite (cámara) para el escaneo.
3. En el menú de Chrome, selecciona "Add to Home screen" / "Install app".
4. La app se instalará y se abrirá en modo standalone.

## Probar offline
1. Con la app abierta, desconecta la red.
2. La mayoría de los assets (HTML/CSS/JS/local libs) se servirán desde cache.
3. El escáner (`html5-qrcode`) funciona offline si está cacheado por el SW.

## Notas sobre la API y CORS
- Las llamadas al backend `https://esta7.com` requieren que el servidor permita CORS si la app hace peticiones desde el navegador con encabezados como `Authorization`.
- Si experimentas errores CORS, revisa que el backend devuelva `Access-Control-Allow-Origin` y `Access-Control-Allow-Headers: Authorization`.

## Forzar actualización del Service Worker
1. En el navegador de la tablet, abre la app y en opciones de desarrollador (si disponible) "Unregister service worker".
2. Alternativamente, borrar datos del sitio y recargar para forzar la instalación del SW más reciente.

## Contacto
Para soporte adicional, solicita ayuda al equipo de TI de Cines Unidos con acceso al backend para revisar políticas CORS y certificados SSL.
