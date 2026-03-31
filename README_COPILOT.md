# Estado del Proyecto: Esta-Park Mobile
**Fecha:** 30 de Marzo, 2026

## 1. Stack Tecnológico Actual
- **Frontend:** HTML5 / CSS3 / JS Vanilla (PWA).
- **Estilos:** Gradientes magenta/púrpura (#723e7b a #9b2352).
- **Estado:** Migrado de .NET 8 a Web Estándar.

## 2. API y Conexión
- **Base URL:** https://esta7.com/ticket
- **Auth:** Basic cHJ1ZWJhOnBydWViYQ==
- **Endpoints:** /verify, /notify, /waive.

## 3. Pendientes y Bloqueos
- [ ] **Bug Visual:** Corregir fuga de código JS en el pie de página (revisar etiquetas <script>).
- [ ] **CORS:** El navegador bloquea las peticiones desde 127.0.0.1 (Error 503/CORS).
- [ ] **Implementar Mock Mode:** Crear simulador de respuestas para desarrollo offline.
