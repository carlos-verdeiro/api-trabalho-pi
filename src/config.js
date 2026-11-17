// Constantes e configurações da API.
// As que vêm do .env têm valor padrão caso a variável não exista.

const inteiroPositivo = (valor, padrao) => {
  const n = parseInt(valor, 10);
  return Number.isInteger(n) && n > 0 ? n : padrao;
};

module.exports = {
  // Sensores aceitos nas leituras (e em ?tipo_leitura=)
  // (os nomes são iguais às colunas da tabela leituras)
  SENSORES: ['temperatura', 'humidade', 'pm25', 'pm10', 'mq135'],
  // Faixa aceita para cada sensor [min, max]
  LIMITES_SENSOR: {
    temperatura: [-50, 100], // °C
    humidade: [0, 100], // %
    pm25: [0, 1000], // µg/m³
    pm10: [0, 1000], // µg/m³
    mq135: [0, 10000], // mesma unidade que o ESP enviar (ppm ou valor bruto do ADC)
  },

  LIMITE_PADRAO: 50,
  LIMITE_MAXIMO: 200,
  PAGINA_MAXIMA: 1000000,

  // Quanto o relógio do ESP pode estar adiantado em relação ao servidor
  TOLERANCIA_FUTURO_MS: 5 * 60 * 1000,

  // ESP é considerado "online" se enviou algo nos últimos X segundos
  STATUS_ONLINE_SEGUNDOS: inteiroPositivo(process.env.STATUS_ONLINE_SEGUNDOS, 300),

  // Mapa de calor: janela padrão (quando não vem data_inicio/data_fim)
  MAPA_JANELA_MINUTOS: inteiroPositivo(process.env.MAPA_JANELA_MINUTOS, 60),
  // Casas decimais usadas para agrupar os ESPs em "localidades" (2 casas ~ 1 km)
  MAPA_PRECISAO_DECIMAIS: inteiroPositivo(process.env.MAPA_PRECISAO_DECIMAIS, 2),
};
