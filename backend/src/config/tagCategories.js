// backend/src/config/tagCategories.js
// Subconjunto inicial de categorías con reglas para Groq

module.exports = [
  {
    tag: "#finanzas",
    idea_principal: "El post habla principalmente de dinero o economía personal.",
    cuando_usar: [
      "Se habla de ahorrar, gastar, invertir, precios, sueldos, inflación o plata/guita en general (palabras clave: plata, guita, dinero, sueldo, inflacion, precios)",
      "Se mencionan deudas, tarjetas, préstamos o problemas de dinero",
    ],
    no_usar_cuando: [
      "La palabra 'plata' forma parte de un lugar (Mar del Plata, La Plata)",
      "El dinero se menciona de pasada y el foco real es otra cosa (viaje, relación, reflexión)",
    ],
    subtags: {
      "#ahorro": "Solo si el objetivo principal es guardar o juntar dinero para algo concreto.",
      "#gastos": "Cuando el foco son compras, consumismo, pagar cuentas o 'me fundí'.",
      "#deudas": "Cuando se habla de deudas, tarjetas al límite o pagos pendientes.",
    },
  },
  {
    tag: "#viajes",
    idea_principal: "Viajar o hacer turismo es el tema central.",
    cuando_usar: [
      "Se cuenta un viaje pasado, presente o futuro (palabras clave: viaje, viajar, viajando, vacaciones, turismo)",
      "Se mencionan vacaciones, turismo, vuelos, hoteles, mochilas",
    ],
    no_usar_cuando: ["El viaje es un detalle menor y el foco es otro (trabajo, estudio, reflexión)"],
    subtags: {
      "#argentina": "Viajes o experiencias dentro de Argentina o que destacan contexto argentino.",
      "#mardelplata": "Viaje o experiencia específica en Mar del Plata / MDQ / La Feliz.",
      "#buenosaires": "Vida o experiencias en Buenos Aires/CABA (barrios, obelisco, subte, bondi).",
      "#playa": "Cuando el foco del viaje es la playa, mar, arena, sol.",
    },
  },
  {
    tag: "#comida",
    idea_principal: "El foco es comer o preparar comida.",
    cuando_usar: [
      "Se habla de desayunos, almuerzos, cenas, recetas, restaurantes, delivery",
      "Se muestra un plato o se comenta sobre su sabor/preparación",
    ],
    no_usar_cuando: ["La comida es un detalle en un post cuyo foco es otro (estudio, trabajo, reflexión)"],
    subtags: {
      "#bebidas": "Cuando el foco son bebidas (café, mate, tragos, gaseosas, alcohol).",
    },
  },
  {
    tag: "#musica",
    idea_principal: "La música es el tema central.",
    cuando_usar: ["Se habla de canciones, artistas, playlists, conciertos, géneros musicales"],
    no_usar_cuando: ["La música solo aparece como fondo mientras se hace otra cosa (estudiar, trabajar)"],
    subtags: {
      "#entretenimiento": "Películas, series, TV, streaming, contenido para ocio (no solo música).",
    },
  },
  {
    tag: "#deporte",
    idea_principal: "Actividad física o deporte como tema principal.",
    cuando_usar: ["Partidos, entrenamientos, resultados, equipos, competencias"],
    no_usar_cuando: ["La actividad física es secundaria a otro tema (paseo, despejar la mente de otro problema)"],
    subtags: {
      "#salud": "Cuando el foco es salud física/mental, bienestar, médicos, terapia, gym por salud.",
    },
  },
  {
    tag: "#humor",
    idea_principal: "El objetivo del post es hacer reír o compartir algo gracioso.",
    cuando_usar: ["Chistes, memes, tono claramente cómico o irónico"],
    no_usar_cuando: [
      "Tema sensible o serio donde el humor es mínimo (duelo, trauma, salud mental grave)",
    ],
    subtags: {
      "#reflexion": "Cuando el post es introspectivo o de pensamientos/enseñanzas personales.",
    },
  },
  {
    tag: "#amor",
    idea_principal: "Relación afectiva romántica.",
    cuando_usar: ["Parejas, citas, rupturas, relaciones serias"],
    no_usar_cuando: ["Amor a objetos/comida (mejor usar #comida o tema específico)"],
    subtags: {
      "#familia": "Reuniones o vínculos familiares (asados, abuelos, hijos, padres).",
      "#amigos": "Juntadas o experiencias donde la amistad es el foco.",
    },
  },
  {
    tag: "#lifestyle",
    idea_principal: "Rutina y forma de encarar la vida (día a día, hábitos).",
    cuando_usar: ["Post de rutina diaria, cambios de hábitos, estilo de vida"],
    no_usar_cuando: ["Hay un tema claro más específico que aplica (finanzas, viajes, salud, etc.)"],
    subtags: {
      "#trabajo": "Experiencias laborales, carrera, empleo, reuniones, productividad.",
      "#educacion": "Estudio formal o cursos, parciales, finales, aprendizaje.",
    },
  },
];
