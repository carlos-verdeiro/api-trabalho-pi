const { SENSORES, STATUS_ONLINE_SEGUNDOS } = require('../config');

// Date -> string ISO (aceita null)
const iso = (data) => (data ? new Date(data).toISOString() : null);

const arredondar = (valor, casas) => {
  if (valor === null || valor === undefined) return null;
  const f = 10 ** casas;
  return Math.round(valor * f) / f;
};

function statusDoEsp(ultimoEnvio) {
  if (!ultimoEnvio) return 'offline';
  const segundos = (Date.now() - new Date(ultimoEnvio).getTime()) / 1000;
  return segundos <= STATUS_ONLINE_SEGUNDOS ? 'online' : 'offline';
}

// Linha da tabela leituras -> objeto da resposta. `tipos` filtra os sensores (null = todos).
function formatarLeitura(linha, tipos) {
  const informacoes = {};
  SENSORES.forEach((sensor) => {
    if (!tipos || tipos.includes(sensor)) informacoes[sensor] = linha[sensor];
  });
  return {
    id_leitura: linha.id,
    tempo_leitura: iso(linha.tempo_leitura),
    inserido: iso(linha.inserido),
    informacoes,
  };
}

function montarPaginacao(total, pagina, limite) {
  return { pagina, limite, total, total_paginas: Math.ceil(total / limite) };
}

module.exports = { iso, arredondar, statusDoEsp, formatarLeitura, montarPaginacao };
