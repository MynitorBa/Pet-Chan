const typeEffectiveness = {
    normal: {
      strongAgainst: [],
      weakAgainst: ['roca', 'acero'],
      noEffectAgainst: ['fantasma'],
      color: '#A8A878'
    },
    fuego: {
      strongAgainst: ['planta', 'hielo', 'bicho', 'acero'],
      weakAgainst: ['agua', 'roca', 'tierra', 'dragon'],
      color: '#F08030'
    },
    agua: {
      strongAgainst: ['fuego', 'tierra', 'roca'],
      weakAgainst: ['planta', 'electrico'],
      color: '#6890F0'
    },
    electrico: {
      strongAgainst: ['agua', 'volador'],
      weakAgainst: ['planta', 'electrico', 'dragon', 'tierra'],
      noEffectAgainst: ['tierra'],
      color: '#F8D030'
    },
    planta: {
      strongAgainst: ['agua', 'tierra', 'roca'],
      weakAgainst: ['fuego', 'planta', 'veneno', 'volador', 'bicho', 'acero', 'dragon'],
      color: '#78C850'
    },
    hielo: {
      strongAgainst: ['planta', 'tierra', 'volador', 'dragon'],
      weakAgainst: ['fuego', 'agua', 'hielo', 'acero'],
      color: '#98D8D8'
    },
    lucha: {
      strongAgainst: ['normal', 'hielo', 'roca', 'siniestro', 'acero'],
      weakAgainst: ['veneno', 'volador', 'psiquico', 'bicho', 'hada'],
      noEffectAgainst: ['fantasma'],
      color: '#C03028'
    },
    veneno: {
      strongAgainst: ['planta', 'hada'],
      weakAgainst: ['veneno', 'tierra', 'roca', 'fantasma'],
      noEffectAgainst: ['acero'],
      color: '#A040A0'
    },
    tierra: {
      strongAgainst: ['fuego', 'electrico', 'veneno', 'roca', 'acero'],
      weakAgainst: ['planta', 'bicho'],
      noEffectAgainst: ['volador'],
      color: '#E0C068'
    },
    volador: {
      strongAgainst: ['planta', 'lucha', 'bicho'],
      weakAgainst: ['electrico', 'roca', 'acero'],
      color: '#A890F0'
    },
    psiquico: {
      strongAgainst: ['lucha', 'veneno'],
      weakAgainst: ['psiquico', 'acero'],
      noEffectAgainst: ['siniestro'],
      color: '#F85888'
    },
    bicho: {
      strongAgainst: ['planta', 'psiquico', 'siniestro'],
      weakAgainst: ['fuego', 'lucha', 'veneno', 'volador', 'fantasma', 'acero', 'hada'],
      color: '#A8B820'
    },
    roca: {
      strongAgainst: ['fuego', 'hielo', 'volador', 'bicho'],
      weakAgainst: ['lucha', 'tierra', 'acero'],
      color: '#B8A038'
    },
    fantasma: {
      strongAgainst: ['psiquico', 'fantasma'],
      weakAgainst: ['siniestro'],
      noEffectAgainst: ['normal'],
      color: '#705898'
    },
    dragon: {
      strongAgainst: ['dragon'],
      weakAgainst: ['acero'],
      noEffectAgainst: ['hada'],
      color: '#7038F8'
    },
    siniestro: {
      strongAgainst: ['psiquico', 'fantasma'],
      weakAgainst: ['lucha', 'siniestro', 'hada'],
      color: '#705848'
    },
    acero: {
      strongAgainst: ['hielo', 'roca', 'hada'],
      weakAgainst: ['fuego', 'agua', 'electrico', 'acero'],
      color: '#B8B8D0'
    },
    hada: {
      strongAgainst: ['lucha', 'dragon', 'siniestro'],
      weakAgainst: ['fuego', 'veneno', 'acero'],
      color: '#EE99AC'
    }
  };

  export { typeEffectiveness };