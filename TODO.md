## [2026-04-13] Mobile Optimization v3.4.0

### Tareas
- [x] Setup: crear branch y TODO
- [x] Controles táctiles optimizados
  - [x] Sliders con thumb más grande (24px+)
  - [x] Botones táctiles más grandes
  - [x] Espaciado aumentado entre controles
  - [x] Touch targets mínimo 44px
- [x] Bottom sheet para controles en móvil
- [x] Prevenir zoom en inputs (viewport)
- [ ] Test en iOS Safari + Chrome Android
- [x] PR y merge

### Revisión de Copilot - Comentarios resueltos
- [x] Accesibilidad: viewport permite zoom (eliminado user-scalable=no)
- [x] Accesibilidad: agregados atributos ARIA (role, aria-modal, aria-labelledby, aria-expanded, aria-hidden)
- [x] Accesibilidad: implementado focus trapping en bottom sheet
- [x] Accesibilidad: focus retorna al toggle button al cerrar
- [x] UX: safe-area insets en botón toggle (iPhone notch)
- [x] UX: range inputs scopados solo a mobile
- [x] UX: handle del bottom sheet ahora clickeable y navegable por teclado
- [x] Código: overflow del body se guarda/restaura correctamente
- [x] Código: variable success sin usar eliminada
- [x] A11y: visibility + aria-hidden controla accesibilidad del sheet cerrado

### Resultado
✅ PR creado: https://github.com/cazucito/jpc/pull/27
🔄 Commit de fixes aplicado
