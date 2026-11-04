const { ErroApi } = require('./http');
const {
  SENSORES, LIMITE_PADRAO, LIMITE_MAXIMO, PAGINA_MAXIMA,
} = require('../config');

const ehNumero = (v) => typeof v === 'number' && Number.isFinite(v);

const ISO_8601 = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

// Converte uma string ISO 8601 em Date (sem fuso => assume UTC). Retorna null se inválida.
function parseIso(valor) {
  if (typeof valor !== 'string') return null;
  const texto = valor.trim();
  const m = ISO_8601.exec(texto);
  if (!m) return null;

  let normalizado = texto.replace(' ', 'T');
  if (!normalizado.includes('T')) normalizado += 'T00:00:00Z';
  else if (!m[1]) normalizado += 'Z';

  const data = new Date(normalizado);
  return Number.isNaN(data.getTime()) ? null : data;
}

// ?pagina=1&limite=50  (limite é limitado ao máximo, não gera erro)
function lerPaginacao(query) {
  const detalhes = [];

  const ler = (valor, nome, padrao, maximo) => {
    if (valor === undefined || valor === '') return padrao;
    if (!/^\d+$/.test(String(valor)) || parseInt(valor, 10) < 1) {
      detalhes.push(`${nome} deve ser um inteiro maior que zero`);
      return padrao;
    }
    return Math.min(parseInt(valor, 10), maximo);
  };

  const pagina = ler(query.pagina, 'pagina', 1, PAGINA_MAXIMA);
  const limite = ler(query.limite, 'limite', LIMITE_PADRAO, LIMITE_MAXIMO);

  if (detalhes.length) {
    throw new ErroApi(400, 'VALIDATION_ERROR', 'Parâmetros de paginação inválidos', detalhes);
  }
  return { pagina, limite, offset: (pagina - 1) * limite };
}

// ?data_inicio=...&data_fim=...  (cada um é opcional; devolve null quando ausente)
function lerIntervalo(query) {
  const detalhes = [];

  const ler = (valor, nome) => {
    if (valor === undefined || valor === '') return null;
    const data = parseIso(valor);
    if (!data) detalhes.push(`${nome} deve estar no formato ISO 8601`);
    return data;
  };

  const inicio = ler(query.data_inicio, 'data_inicio');
  const fim = ler(query.data_fim, 'data_fim');

  if (!detalhes.length && inicio && fim && inicio > fim) {
    detalhes.push('data_inicio deve ser anterior ou igual a data_fim');
  }
  if (detalhes.length) {
    throw new ErroApi(400, 'INVALID_DATE_RANGE', 'Intervalo de datas inválido', detalhes);
  }
  return { inicio, fim };
}

// ?tipo_leitura=temperatura;humidade  (separado por ; ou ,). null = todos os sensores.
function lerTiposLeitura(valor) {
  if (valor === undefined || valor === '') return null;

  const tipos = [...new Set(
    String(valor).split(/[;,]/).map((t) => t.trim().toLowerCase()).filter(Boolean),
  )];
  const invalidos = tipos.filter((t) => !SENSORES.includes(t));

  if (tipos.length === 0 || invalidos.length) {
    throw new ErroApi(
      400,
      'INVALID_SENSOR_TYPE',
      'Tipo de sensor inválido',
      [`tipos válidos: ${SENSORES.join(', ')}`],
    );
  }
  return tipos;
}

// ?ordenar=asc|desc  (padrão desc)
function lerOrdem(valor) {
  if (valor === undefined || valor === '') return 'desc';
  const ordem = String(valor).toLowerCase();
  if (ordem !== 'asc' && ordem !== 'desc') {
    throw new ErroApi(400, 'VALIDATION_ERROR', 'Parâmetro ordenar inválido', ['ordenar deve ser asc ou desc']);
  }
  return ordem;
}

module.exports = {
  ehNumero, parseIso, lerPaginacao, lerIntervalo, lerTiposLeitura, lerOrdem,
};
