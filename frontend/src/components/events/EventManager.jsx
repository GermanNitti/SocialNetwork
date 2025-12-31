import React from 'react';
import MidnightLaunch from './midnightLaunch';
import { EVENT_CONFIG, NEW_YEAR_2026_CONFIG } from './EventConfig';

export const EVENT_TYPES = {
  MIDNIGHT_LAUNCH: 'midnight_launch',
  // Agregar más tipos de eventos aquí en el futuro
  // ANNIVERSARY: 'anniversary',
  // HALLOWEEN: 'halloween',
  // BLACK_FRIDAY: 'black_friday',
};

export const EVENTS = [
  {
    id: EVENT_TYPES.MIDNIGHT_LAUNCH,
    name: 'Lanzamiento de Año Nuevo 2026',
    description: 'Celebración especial de fin de año',
    component: MidnightLaunch,
    schedule: {
      enabled: NEW_YEAR_2026_CONFIG.enabled,
      startDateTime: NEW_YEAR_2026_CONFIG.startDateTime,
      endDateTime: NEW_YEAR_2026_CONFIG.endDateTime,
      timezone: NEW_YEAR_2026_CONFIG.timezone,
    },
    testMode: NEW_YEAR_2026_CONFIG.testMode,
    phases: NEW_YEAR_2026_CONFIG.phases,
    visual: NEW_YEAR_2026_CONFIG.visual,
  },
  // Agregar más eventos aquí en el futuro
];

export function shouldShowEvent(event) {
  const { schedule, testMode } = event;
  const { debugMode, allowTestMode } = EVENT_CONFIG;

  // Si está en modo de prueba y está habilitado, siempre mostrar
  if (testMode?.enabled && allowTestMode) {
    if (debugMode) {
      console.log('[EventManager] Evento en modo de prueba:', event.name);
    }
    return true;
  }

  // Si el evento no está habilitado en el schedule
  if (!schedule?.enabled) {
    if (debugMode) {
      console.log('[EventManager] Evento deshabilitado:', event.name);
    }
    return false;
  }

  // Usar overrideDate si está configurado en test mode
  const now = testMode?.overrideDate
    ? new Date(testMode.overrideDate)
    : new Date();

  const startDate = new Date(schedule.startDateTime);
  const endDate = new Date(schedule.endDateTime);

  // Verificar si estamos dentro del rango de fechas
  const isActive = now >= startDate && now <= endDate;

  if (debugMode) {
    console.log('[EventManager] Verificando evento:', event.name, {
      now: now.toISOString(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      isActive,
    });
  }

  return isActive;
}

export function getActiveEvent() {
  if (!EVENT_CONFIG.eventsEnabled) {
    if (EVENT_CONFIG.debugMode) {
      console.log('[EventManager] Eventos deshabilitados globalmente');
    }
    return null;
  }

  for (const event of EVENTS) {
    if (shouldShowEvent(event)) {
      if (EVENT_CONFIG.debugMode) {
        console.log('[EventManager] Evento activo encontrado:', event.name);
      }
      return event;
    }
  }

  if (EVENT_CONFIG.debugMode) {
    console.log('[EventManager] No hay eventos activos en este momento');
  }
  return null;
}

export function getTestModeEvent() {
  // Devuelve el primer evento que tiene testMode.enabled = true
  const eventWithTestMode = EVENTS.find(event => event.testMode?.enabled && EVENT_CONFIG.allowTestMode);

  if (eventWithTestMode) {
    return eventWithTestMode;
  }

  // Si no hay evento con testMode específico, devuelve el primer evento para pruebas
  return EVENTS.length > 0 ? EVENTS[0] : null;
}

export function getTestableEvent() {
  // Devuelve cualquier evento disponible para probar (independientemente de si está activo por fecha)
  // Útil para botones de prueba que deben aparecer siempre
  // Si no hay eventos configurados, devuelve null
  return EVENTS.length > 0 ? EVENTS[0] : null;
}

export function isEventActive(eventId) {
  const event = EVENTS.find(e => e.id === eventId);
  return event ? shouldShowEvent(event) : false;
}
