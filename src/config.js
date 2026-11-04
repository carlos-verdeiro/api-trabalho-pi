// Constantes e configurações da API.
// As que vêm do .env têm valor padrão caso a variável não exista.

const inteiroPositivo = (valor, padrao) => {
  const n = parseInt(valor, 10);
  return Number.isInteger(n) && n > 0 ? n : padrao;
};

module.exports = {
  // Sensores aceitos nas leituras (e em ?tipo_leitura=)
  SENSORES: ['temperatura', 'humidade'],
  // Faixa aceita para cada sensor [min, max]
  LIMITES_SENSOR: { temperatura: [-50, 100], humidade: [0, 100] },

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
