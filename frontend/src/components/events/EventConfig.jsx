export const EVENT_CONFIG = {
  // CONFIGURACIÓN GLOBAL DE EVENTOS
  eventsEnabled: true,

  // MODO DE DESARROLLO
  // true: Modo desarrollo - mostrar botón de prueba
  // false: Modo producción - ocultar botón de prueba
  developmentMode: true,

  // PERMITE PROBAR EVENTOS EN DESARROLLO
  // true: Los eventos se pueden probar con botón (solo si developmentMode = true)
  // false: No se permite probar eventos
  allowTestMode: true,

  // LOGGING
  // true: Imprime en consola información sobre eventos activos
  // false: Sin logs
  debugMode: false,

  // CONFIGURACIÓN POR DEFECTO DE TEST MODE
  // Si no se especifica en un evento, usa estos valores
  defaultTestMode: {
    enabled: false,
    overrideDate: null,
  },

  // ZONA HORARIA POR DEFECTO
  defaultTimezone: 'America/Argentina/Buenos_Aires',
};

export const NEW_YEAR_2026_CONFIG = {
  // EVENTO: AÑO NUEVO 2026
  // Descripción: Efecto de lanzamiento para celebrar el año nuevo

  // FECHA DE ACTIVACIÓN
  startDateTime: '2026-01-01T00:00:00', // 1 de enero de 2026 a las 00:00:00
  endDateTime: '2026-01-01T23:59:59',   // 1 de enero de 2026 a las 23:59:59 (todo el día)

  // ZONA HORARIA
  timezone: 'America/Argentina/Buenos_Aires',

  // ESTADO DEL EVENTO
  enabled: true, // true = activado, false = desactivado

  // MODO DE PRUEBA
  testMode: {
    enabled: false, // true = mostrar siempre (para pruebas), false = respeta fechas
    overrideDate: null, // Opcional: fecha específica para simular (formato ISO 8601)
  },

  // DURACIÓN DE CADA FASE (en milisegundos)
  phases: {
    countdown: 10000,    // 10 segundos de cuenta regresiva
    explosion: 3000,      // 3 segundos de explosión
    welcome: 3000,       // 3 segundos de bienvenida
    totalDuration: 16000, // Total: 16 segundos
  },

  // CONFIGURACIÓN VISUAL
  visual: {
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F'], // Colores de partículas
    particleCount: 200,    // Número de partículas en la explosión
    confettiCount: 100,   // Número de confettis cayendo
    shakeIntensity: 10,   // Intensidad de la vibración (px)
  },
};

export const EVENT_TEMPLATES = {
  // Plantillas para futuros eventos

  // EVENTO DE DURACIÓN ESPECÍFICA (ej. lanzamiento de feature)
  singleDay: (date, eventName) => ({
    startDateTime: `${date}T00:00:00`,
    endDateTime: `${date}T23:59:59`,
    timezone: EVENT_CONFIG.defaultTimezone,
    enabled: true,
    testMode: {
      enabled: false,
      overrideDate: null,
    },
  }),

  // EVENTO DE VARIOS DÍAS (ej. semana especial)
  multiDay: (startDate, endDate, eventName) => ({
    startDateTime: `${startDate}T00:00:00`,
    endDateTime: `${endDate}T23:59:59`,
    timezone: EVENT_CONFIG.defaultTimezone,
    enabled: true,
    testMode: {
      enabled: false,
      overrideDate: null,
    },
  }),

  // EVENTO DE HORA ESPECÍFICA (ej. medianoche, 15:00)
  specificTime: (date, time, eventName) => ({
    startDateTime: `${date}T${time}`,
    endDateTime: `${date}T${time}`,
    timezone: EVENT_CONFIG.defaultTimezone,
    enabled: true,
    testMode: {
      enabled: false,
      overrideDate: null,
    },
  }),

  // EVENTO HABILITADO (sin fecha específica)
  alwaysEnabled: (eventName) => ({
    startDateTime: '2020-01-01T00:00:00',
    endDateTime: '2099-12-31T23:59:59',
    timezone: EVENT_CONFIG.defaultTimezone,
    enabled: true,
    testMode: {
      enabled: false,
      overrideDate: null,
    },
  }),
};
