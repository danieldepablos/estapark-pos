## Plan: EstaPark POS PWA

Construir una SPA POS táctil para validar, pagar y exonerar tickets con flujo manual y escaneo, usando Vanilla JS y API remota con Basic Auth. Se implementará con 3 archivos mínimos (index.html + manifest.json + sw.js) para garantizar instalación PWA y carga instantánea en Android/Laptop, manteniendo lógica y UI simples para pruebas rápidas.

**Steps**
1. Definir estructura base de UI en index.html: card central, área de mensajes, campo manual, botón de escaneo, contenedor de cámara, panel de resultado y botones PAGAR/EXONERAR. Esta base habilita todos los estados visuales.
2. Implementar estilos responsive en index.html con gradiente 135deg (#723e7b -> #9b2352), card blanca redondeada 24px, sombras suaves, layout tablet/laptop y botones táctiles >= 65px. Dependencia: paso 1.
3. Implementar capa de estado en JavaScript (idle, scanning, loading, result, success/error), renderizado condicional y mensajes inline sin alert(). Dependencia: pasos 1-2.
4. Implementar cliente API con Fetch + Basic Auth persistente (prueba:prueba), función genérica request, try/catch, normalización de errores HTTP/red y mapeo de endpoints verify/notify/waive. Dependencia: paso 3.
5. Implementar flujo funcional principal: entrada manual -> verify -> mostrar amount/enter_date -> acciones PAGAR/EXONERAR -> feedback final y retorno a estado inicial. Dependencia: paso 4.
6. Integrar html5-qrcode por CDN para escaneo por cámara con start/stop robusto, permisos, selección de cámara por defecto y escritura automática del código detectado para disparar verify. Dependencia: paso 3; puede avanzarse en paralelo con paso 4.
7. Implementar manifest.json con nombre, short_name, start_url, display standalone, theme/background colors e iconos mínimos compatibles Android Chrome. Dependencia: paso 1.
8. Implementar sw.js básico con estrategia cache-first para shell estático y network-first para API, más fallback de error de red para mantener UX clara. Dependencia: pasos 4 y 7.
9. Registrar Service Worker y meta-tags PWA en index.html (theme-color, mobile-web-app-capable), y validar criterio de instalabilidad y comportamiento inicial offline. Dependencia: pasos 7-8.
10. Ajustar detalles de UX para operación POS táctil: foco inicial en input, bloqueo de acciones durante loading, botón detener escaneo, textos de estado claros y recuperación ante errores. Dependencia: pasos 5-6.

**Relevant files**
- c:/workspace/Copilot/EstaPark PWA/index.html — estructura SPA, estilos responsivos, estados UI, integración html5-qrcode, cliente API y registro SW.
- c:/workspace/Copilot/EstaPark PWA/manifest.json — configuración instalable PWA para Android Chrome.
- c:/workspace/Copilot/EstaPark PWA/sw.js — cache de shell estático, manejo offline básico y estrategia de fetch.
- c:/workspace/Copilot/EstaPark PWA/icons/* — iconos PWA requeridos por manifest (mínimo 192 y 512).

**Verification**
1. Verificar flujo manual completo: código válido -> /verify -> muestra amount/enter_date -> /notify y /waive con mensajes de éxito/error sin alert().
2. Verificar flujo de escaneo: activar cámara, leer código, detener cámara al detectar, ejecutar verify y mostrar resultado.
3. Verificar errores de red y API: simular offline, 401, 404 y 500; confirmar mensajes claros y recuperación de UI.
4. Verificar responsive en tablet landscape y laptop: card centrada, controles legibles y botones >= 65px.
5. Verificar instalabilidad PWA en Android Chrome: manifest válido, SW activo, opción Agregar a pantalla principal disponible.
6. Verificar arranque rápido con caché (segunda carga) y que llamadas API sigan yendo a red.

**Decisions**
- Alineación cerrada: se adopta variante de 3 archivos mínimos para PWA completa (no single-file estricto).
- Alcance incluido: POS frontend web, escaneo cámara, integración API y PWA básica.
- Alcance excluido: backend propio, autenticación dinámica, cola offline transaccional y nativa mobile compile.

**Further Considerations**
1. Definir política de iconos iniciales: usar placeholders funcionales ahora o branding final desde inicio.
2. Confirmar formato exacto de códigos de ticket (longitud/patrón) para validación previa a verify.
3. Confirmar comportamiento post-pago/exoneración: limpiar formulario automáticamente vs mantener último resultado por auditoría visual.
