# Sistema de Eventos Especiales

El sistema de eventos permite implementar animaciones y efectos especiales para eventos específicos (Año Nuevo, lanzamientos, aniversarios, etc.) de manera escalable.

## Estructura

```
frontend/src/components/events/
├── EventManager.jsx       # Lógica de eventos
├── EventConfig.jsx          # Configuración de todos los eventos
├── midnightLaunch.jsx      # Evento de Año Nuevo
├── README.md                # Esta documentación
└── [nuevoEvento].jsx        # Futuros eventos...
```

## Archivos

### EventManager.jsx
- Define la lista de eventos disponibles
- Determina qué evento debe mostrarse
- Funciones para verificar eventos activos

### EventConfig.jsx
- Configuración centralizada de todos los eventos
- Fechas de activación/desactivación
- Modos de prueba
- Configuraciones visuales

### midnightLaunch.jsx
- Componente del evento de Año Nuevo
- Animación de cuenta regresiva
- Explosión de partículas
- Bienvenida con confetti

## Configuración Actual

### Año Nuevo 2026

El evento de Año Nuevo está configurado en `EventConfig.jsx`:

```javascript
export const NEW_YEAR_2026_CONFIG = {
  startDateTime: '2026-01-01T00:00:00', // 1 de enero a las 00:00:00
  endDateTime: '2026-01-01T23:59:59',   // Todo el día
  timezone: 'America/Argentina/Buenos_Aires',
  enabled: true,
  testMode: {
    enabled: false, // Cambiar a true para probar
    overrideDate: null,
  },
};
```

## Cómo Agregar un Nuevo Evento

### Paso 1: Crear el Componente del Evento

Crea un nuevo archivo en `frontend/src/components/events/`:

```jsx
import React from 'react';

export default function MiNuevoEvento({ onComplete }) {
  // Tu lógica de animación
  // Llama a onComplete() cuando termine la animación
  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Tu contenido */}
    </div>
  );
}
```

### Paso 2: Registrar el Evento en EventManager.jsx

1. Agrega el tipo de evento a `EVENT_TYPES`:

```javascript
export const EVENT_TYPES = {
  MIDNIGHT_LAUNCH: 'midnight_launch',
  MI_NUEVO_EVENTO: 'mi_nuevo_evento', // <-- Agregar aquí
};
```

2. Importa el componente:

```javascript
import MidnightLaunch from './midnightLaunch';
import MiNuevoEvento from './miNuevoEvento'; // <-- Agregar aquí
```

3. Agrega el evento al array `EVENTS`:

```javascript
export const EVENTS = [
  {
    id: EVENT_TYPES.MIDNIGHT_LAUNCH,
    name: 'Lanzamiento de Año Nuevo 2026',
    description: 'Celebración especial de fin de año',
    component: MidnightLaunch,
    schedule: {
      enabled: true,
      startDateTime: '2026-01-01T00:00:00',
      endDateTime: '2026-01-01T23:59:59',
      timezone: 'America/Argentina/Buenos_Aires',
    },
    testMode: {
      enabled: false,
      overrideDate: null,
    },
  },
  {
    id: EVENT_TYPES.MI_NUEVO_EVENTO, // <-- Nuevo evento
    name: 'Mi Nuevo Evento',
    description: 'Descripción del evento',
    component: MiNuevoEvento,
    schedule: {
      enabled: true,
      startDateTime: '2026-02-14T00:00:00',
      endDateTime: '2026-02-14T23:59:59',
      timezone: 'America/Argentina/Buenos_Aires',
    },
    testMode: {
      enabled: false,
      overrideDate: null,
    },
  },
];
```

### Paso 3: Opcional - Crear Configuración en EventConfig.jsx

Para mejor organización, puedes crear la configuración del evento en `EventConfig.jsx`:

```javascript
export const MI_NUEVO_EVENTO_CONFIG = {
  startDateTime: '2026-02-14T00:00:00',
  endDateTime: '2026-02-14T23:59:59',
  timezone: 'America/Argentina/Buenos_Aires',
  enabled: true,
  testMode: {
    enabled: false,
    overrideDate: null,
  },
  phases: {
    phase1: 3000, // 3 segundos
    phase2: 2000, // 2 segundos
    totalDuration: 5000,
  },
  visual: {
    colors: ['#FF6B6B', '#4ECDC4'],
    particleCount: 100,
  },
};
```

Y usarla en `EventManager.jsx`:

```javascript
import { MI_NUEVO_EVENTO_CONFIG } from './EventConfig';

// En el array EVENTS
{
  id: EVENT_TYPES.MI_NUEVO_EVENTO,
  name: 'Mi Nuevo Evento',
  component: MiNuevoEvento,
  schedule: MI_NUEVO_EVENTO_CONFIG,
  testMode: MI_NUEVO_EVENTO_CONFIG.testMode,
  phases: MI_NUEVO_EVENTO_CONFIG.phases,
  visual: MI_NUEVO_EVENTO_CONFIG.visual,
}
```

## Cómo Probar un Evento

### Opción 1: Botón de Prueba en la App

Si `allowTestMode: true` en `EventConfig.jsx`, aparecerá un botón ▶️ en la navbar para probar eventos.

### Opción 2: Habilitar Test Mode

En `EventConfig.jsx`, cambia `testMode.enabled` a `true`:

```javascript
export const NEW_YEAR_2026_CONFIG = {
  // ...
  testMode: {
    enabled: true, // <-- Cambiar a true
    overrideDate: null,
  },
};
```

### Opción 3: Override Date

Para probar como si fuera otra fecha específica:

```javascript
export const NEW_YEAR_2026_CONFIG = {
  // ...
  testMode: {
    enabled: true,
    overrideDate: '2025-12-31T23:59:59', // Simula fin de año
  },
};
```

## Configurar para Producción

Cuando el evento esté listo y probado:

### 1. Verificar EventConfig.jsx

```javascript
export const NEW_YEAR_2026_CONFIG = {
  // Fechas correctas
  startDateTime: '2026-01-01T00:00:00',
  endDateTime: '2026-01-01T23:59:59',

  // Evento habilitado
  enabled: true,

  // Test mode desactivado
  testMode: {
    enabled: false, // <-- IMPORTANTE: false
    overrideDate: null,
  },
};
```

### 2. Verificar EventConfig Global

```javascript
export const EVENT_CONFIG = {
  eventsEnabled: true, // Eventos activos
  allowTestMode: true, // Permitir probar con botón
  debugMode: false, // Logs desactivados
};
```

### 3. Probar con Override Date

Antes de la fecha real, puedes simular:

```javascript
export const NEW_YEAR_2026_CONFIG = {
  // ...
  testMode: {
    enabled: true, // Solo para pruebas
    overrideDate: '2026-01-01T00:00:01', // Un segundo después de inicio
  },
};
```

## Formato de Fechas

Usa el formato ISO 8601: `YYYY-MM-DDTHH:mm:ss`

### Ejemplos

```javascript
'2026-01-01T00:00:00'  // 1 de enero de 2026 a las 00:00:00
'2026-01-01T12:30:00'  // 1 de enero de 2026 a las 12:30:00
'2026-01-01T23:59:59'  // 1 de enero de 2026 a las 23:59:59
```

## Plantillas de Eventos

En `EventConfig.jsx` hay plantillas para eventos comunes:

### Evento de un día

```javascript
EVENT_TEMPLATES.singleDay('2026-12-30', 'Aniversario 2026')
```

### Evento de varios días

```javascript
EVENT_TEMPLATES.multiDay('2026-02-14', '2026-02-16', 'Semana del Amor')
```

### Evento a hora específica

```javascript
EVENT_TEMPLATES.specificTime('2026-12-31', '23:59:00', 'Cuenta Regresiva')
```

## Eventos Futuros

### Ideas de Eventos

1. **Aniversario de la App** - Celebrar el cumpleaños de la red social
2. **Halloween** - Tema espeluznante con efectos especiales
3. **Día del Amor** - Corazones y efectos románticos
4. **Día de la Independencia** - Efectos patrios
5. **Navidad** - Nieve, renos y villancicos
6. **Black Friday** - Descuentos y ofertas especiales
7. **Lanzamientos de Features** - Anunciar nuevas funcionalidades

### Ejemplo: Aniversario

```javascript
// En EventConfig.jsx
export const ANNIVERSARY_2026_CONFIG = {
  startDateTime: '2026-12-30T00:00:00',
  endDateTime: '2026-12-30T23:59:59',
  timezone: 'America/Argentina/Buenos_Aires',
  enabled: true,
  testMode: {
    enabled: false,
    overrideDate: null,
  },
  phases: {
    intro: 2000,
    celebration: 4000,
    outro: 2000,
    totalDuration: 8000,
  },
};
```

## Debugging

### Activar Logs

En `EventConfig.jsx`, cambia `debugMode` a `true`:

```javascript
export const EVENT_CONFIG = {
  debugMode: true, // Mostrar logs en consola
  // ...
};
```

### Logs Disponibles

```
[EventManager] Evento deshabilitado: Nombre del evento
[EventManager] Verificando evento: Nombre del evento
[EventManager] Evento activo encontrado: Nombre del evento
[EventManager] No hay eventos activos en este momento
[EventManager] Evento en modo de prueba: Nombre del evento
```

## Troubleshooting

### El evento no aparece

1. Verifica que `schedule.enabled` sea `true` en `EventConfig.jsx`
2. Confirma que `eventsEnabled` sea `true` en `EVENT_CONFIG`
3. Verifica que la fecha actual esté entre `startDateTime` y `endDateTime`
4. Revisa la consola del navegador por errores de JavaScript

### El componente no renderiza

1. Verifica que el componente tenga la prop `onComplete` y la llame cuando termine
2. Asegúrate que el componente devuelva `null` cuando termine la animación
3. Revisa los estilos `z-index` para que esté por encima de todo el contenido

### Eventos que se sobreponen

El sistema muestra SOLO el primer evento activo que encuentre en el array `EVENTS`. Si tienes múltiples eventos activos en el mismo momento, solo se mostrará el primero.

## Checklist Antes de Lanzar

Para el evento de Año Nuevo 2026:

- [ ] Evento completamente probado con test mode
- [ ] `testMode.enabled` en `false`
- [ ] `schedule.enabled` en `true`
- [ ] Fechas correctas (`2026-01-01T00:00:00` a `2026-01-01T23:59:59`)
- [ ] Zona horaria correcta (`America/Argentina/Buenos_Aires`)
- [ ] `eventsEnabled` en `true`
- [ ] `debugMode` en `false`
- [ ] Pruebas en múltiples navegadores
- [ ] Animaciones fluidas sin errores
- [ ] Componente llama `onComplete()` cuando termina

## Notas Importantes

- Todos los componentes de eventos deben tener `z-[9999]` para estar por encima de todo
- Los eventos usan `position: fixed` para cubrir toda la pantalla
- Cada evento debe llamar a `onComplete()` cuando termine la animación
- Los eventos son completamente independientes y reutilizables
- Usa las plantillas de `EVENT_TEMPLATES` para crear eventos rápidamente
- La configuración está centralizada en `EventConfig.jsx` para fácil modificación
