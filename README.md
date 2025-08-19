# ProyectoFinalPerezRomero - Simulador Ecommerce (Entrega final)

## Descripción
Pequeño simulador de Ecommerce que cumple las consignas solicitadas:
- Carga datos remotos desde `products.json` (simulado).
- Genera HTML interactivamente desde `app.js`.
- Usa librería externa SweetAlert2 para reemplazar alert/prompt/confirm.
- Simula flujo de compra completo: agregar productos, editar cantidades, checkout con formulario, validación de stock, resumen de orden.
- Guarda carrito en `localStorage` para persistencia.

## Contenido del ZIP
- index.html
- styles.css
- app.js
- products.json
- README.md

## Cómo abrir
1. Descomprimir `ProyectoFinalPerezRomero.zip`
2. Abrir `index.html` en el navegador (no requiere servidor, pero algunos navegadores bloquean fetch de archivos locales. Si hay problemas, servir con un servidor simple: `python -m http.server 8000` y abrir `http://localhost:8000/`).

## Autor
Martin Perez Romero (proyecto de entrega)
