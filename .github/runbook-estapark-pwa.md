# Runbook Rapido - EstaPark POS PWA

## Levantar localmente
1. Abrir terminal en la raiz del proyecto.
2. Ejecutar uno de estos comandos:
   - npx serve .
   - python -m http.server 8080
3. Abrir la URL local en navegador.

## Requisitos para escaneo
1. Usar HTTPS en ambientes remotos o localhost en ambiente local.
2. Aceptar permisos de camara.
3. Preferir camara trasera en tablet/telefono.

## API esperada
Base URL: https://esta7.com/ticket/
1. GET verify/{code}: retorna amount y enter_date.
2. GET notify/{code}: procesa pago.
3. GET waive/{code}: exonera ticket.

Autenticacion:
1. Basic Auth persistente con prueba:prueba.

## Verificaciones rapidas post-deploy
1. Carga de index, manifest y sw sin error 404.
2. Registro de service worker exitoso.
3. Verificacion manual de ticket.
4. Escaneo de QR con camara.
5. Pago y exoneracion con mensajes de resultado.

## Problemas frecuentes
1. Camara no inicia:
   - Revisar permisos del navegador.
   - Confirmar contexto seguro (HTTPS/localhost).
2. API responde 401 o CORS:
   - Validar encabezado Authorization.
   - Confirmar configuracion CORS del backend.
3. No aparece instalacion PWA:
   - Revisar manifest valido y service worker activo.

## Versionado operativo
1. Si se modifica cache del service worker, actualizar CACHE_VERSION en sw.js.
2. Reinstalar/recargar PWA en dispositivo para refrescar shell cacheado.
