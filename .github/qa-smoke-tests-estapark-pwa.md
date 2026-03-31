# QA Smoke Tests - EstaPark POS PWA

## 1. Preparacion
1. Servir el proyecto por HTTP local (no abrir index.html con file://):
   - Opcion A: npx serve .
   - Opcion B: python -m http.server 8080
2. Abrir la URL en laptop y en tablet Android (misma version desplegada).
3. Confirmar permisos de camara habilitados en el navegador.

## 2. UI y Responsive
1. Verificar fondo gradiente y card central blanca con bordes redondeados.
2. Confirmar que todos los botones tengan alto tactil comodo (>= 65px).
3. En tablet landscape, validar que no haya recortes ni overflow horizontal.
4. En laptop, validar alineacion y legibilidad de estado, input y acciones.

## 3. Flujo Manual (Verify)
1. Dejar el campo vacio y presionar VERIFICAR.
   - Esperado: mensaje de advertencia en pantalla, sin alertas del navegador.
2. Ingresar un codigo valido y presionar VERIFICAR.
   - Esperado: spinner, luego panel de ticket con codigo, monto y fecha.
3. Probar codigo invalido/no existente.
   - Esperado: mensaje de error claro, sin romper la UI.

## 4. Flujo Escaneo (Camara)
1. Presionar ESCANEAR.
   - Esperado: inicia visor de camara y mensaje de escaneo.
2. Leer un QR valido.
   - Esperado: se detiene escaneo, se llena codigo y corre verify automatico.
3. Probar boton DETENER ESCANEO.
   - Esperado: se cierra escaneo y aparece mensaje de escaneo detenido.

## 5. Flujo de Acciones (Notify/Waive)
1. Con ticket verificado, presionar PAGAR.
   - Esperado: spinner, mensaje de exito, limpieza de input y panel oculto.
2. Con ticket verificado, presionar EXONERAR.
   - Esperado: spinner, mensaje de exito, limpieza de input y panel oculto.
3. Simular error de API en cualquiera de las dos acciones.
   - Esperado: mensaje de error y app permanece operativa.

## 6. Red y Resiliencia
1. Con la app abierta, desconectar internet.
2. Intentar VERIFICAR/PAGAR/EXONERAR.
   - Esperado: mensaje de error de red o sin conexion.
3. Volver a conectar internet.
   - Esperado: mensaje de conexion restablecida.
4. Simular latencia alta (throttling en DevTools) y verificar timeout.
   - Esperado: mensaje de tiempo de espera agotado.

## 7. PWA Instalabilidad
1. Confirmar que existe manifest y service worker activos en DevTools.
2. En Android Chrome, validar opcion Agregar a pantalla principal.
3. Instalar la app y abrirla en modo standalone.
4. Cerrar y reabrir la app instalada.
   - Esperado: carga inicial rapida del shell.

## 8. Criterio de Aceptacion Minimo
1. Verify manual y por escaneo funcional.
2. Notify y Waive funcionales.
3. Sin uso de alert().
4. Mensajes de estado visibles y entendibles.
5. Instalable como PWA en Android Chrome.
