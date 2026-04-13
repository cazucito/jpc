## [2026-04-13] Gallery Mode v3.5.0

### Plan de implementación
- [x] Crear branch feature/gallery-mode
- [x] Agregar funciones seeded random en util.js
- [x] Agregar soporte para seed en UserPreferences
- [x] Agregar toggle/button para activar modo galería
- [x] Crear contenedor grid para mini-canvas (2x2)
- [x] Generar seeds aleatorios para cada miniatura
- [x] Renderizar miniaturas con config actual pero seed diferente
- [x] Click en miniatura = aplicar seed al canvas principal
- [x] Botón "New Variations" para regenerar
- [x] Responsive: adaptar grid según tamaño
- [x] Estilos CSS para galería
- [ ] Test y PR

### Detalles implementados
- Grid 2x2 con 4 variaciones
- Cada miniatura usa seed único para reproducibilidad
- Preview con menos líneas (líneas/4) para velocidad
- Seed se limpia después de usar para mantener random en siguientes renders
- Botón Gallery toggle visibility
- Botón New Variations regenera seeds aleatorios
