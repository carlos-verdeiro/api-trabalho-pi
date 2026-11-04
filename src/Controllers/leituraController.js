const mobileModel = require('../Models/mobileModel');
const leituraModel = require('../Models/leituraModel');
const { ErroApi, asyncHandler } = require('../Utils/http');
const {
  lerPaginacao, lerIntervalo, lerTiposLeitura, lerOrdem,
} = require('../Utils/validacao');
const {
  iso, arredondar, formatarLeitura, montarPaginacao,
} = require('../Utils/formatacao');
const { calcularIndice, categoriaDoIndice, LEGENDA } = require('../Services/qualidadeAr');
const { MAPA_JANELA_MINUTOS, MAPA_PRECISAO_DECIMAIS } = require('../config');

// Lê e valida todos os filtros de listagem da query string
function lerFiltros(query) {
  const { pagina, limite, offset } = lerPaginacao(query);
  const { inicio, fim } = lerIntervalo(query);
  const tipos = lerTiposLeitura(query.tipo_leitura);
  const ordem = lerOrdem(query.ordenar);
  return {
    pagina, limite, offset, inicio, fim, tipos, ordem,
  };
}

async function listarEResponder(res, escopo, filtros, extras = {}) {
  const { linhas, total } = await leituraModel.listar({ escopo, ...filtros });
  res.json({
    sucesso: true,
    dados: {
      ...extras,
      leituras: linhas.map((l) => formatarLeitura(l, filtros.tipos)),
      paginacao: montarPaginacao(total, filtros.pagina, filtros.limite),
    },
  });
}

// GET /mobile/leituras  (público)
const todas = asyncHandler(async (req, res) => {
  const filtros = lerFiltros(req.query);
  await listarEResponder(res, { tipo: 'todos' }, filtros);
});

// GET /mobile/leituras/meus  (privado)
const meus = asyncHandler(async (req, res) => {
  const filtros = lerFiltros(req.query);
  await listarEResponder(res, { tipo: 'app', id: req.mobile.id }, filtros);
});

// Busca o ESP pelo :token_esp, exigindo que esteja vinculado ao app logado
async function espDoApp(req) {
  const esp = await mobileModel.buscarEspDoApp(req.mobile.id, req.params.token_esp);
  if (!esp) throw new ErroApi(404, 'DEVICE_NOT_FOUND', 'Dispositivo não encontrado');
  return esp;
}

// GET /mobile/leituras/:token_esp  (privado, só o dono)
const doEsp = asyncHandler(async (req, res) => {
  const filtros = lerFiltros(req.query);
  const esp = await espDoApp(req);
  await listarEResponder(res, { tipo: 'esp', id: esp.id }, filtros, {
    token_esp: esp.token_esp,
    nome: esp.nome,
  });
});

// GET /mobile/leituras/:token_esp/ultima  (privado, só o dono)
const ultima = asyncHandler(async (req, res) => {
  const esp = await espDoApp(req);
  const leitura = await leituraModel.ultima(esp.id);
  if (!leitura) {
    throw new ErroApi(404, 'READING_NOT_FOUND', 'Nenhuma leitura registrada para este dispositivo');
  }
  res.json({
    sucesso: true,
    dados: {
      ...formatarLeitura(leitura, null),
      token_esp: esp.token_esp,
      nome: esp.nome,
    },
  });
});

// GET /mobile/mapa  (público)
// Sem datas -> última janela (MAPA_JANELA_MINUTOS). Só data_inicio -> até agora.
// Só data_fim -> janela terminando em data_fim.
const mapa = asyncHandler(async (req, res) => {
  let { inicio, fim } = lerIntervalo(req.query);
  const agora = new Date();
  const janelaMs = MAPA_JANELA_MINUTOS * 60 * 1000;

  if (!inicio && !fim) {
    fim = agora;
    inicio = new Date(agora.getTime() - janelaMs);
  } else if (!fim) {
    fim = agora;
  } else if (!inicio) {
    inicio = new Date(fim.getTime() - janelaMs);
  }
  if (inicio > fim) {
    throw new ErroApi(400, 'INVALID_DATE_RANGE', 'Intervalo de datas inválido', ['data_inicio deve ser anterior ou igual a data_fim']);
  }

  const localidades = await leituraModel.agregarMapa({
    inicio,
    fim,
    casasDecimais: MAPA_PRECISAO_DECIMAIS,
  });

  const pontos = localidades.map((loc) => {
    const indice = calcularIndice({ temperatura: loc.temperatura, humidade: loc.humidade });
    return {
      latitude: arredondar(loc.latitude, 6),
      longitude: arredondar(loc.longitude, 6),
      indice_qualidade: indice,
      categoria: categoriaDoIndice(indice).categoria,
      total_leituras: loc.total_leituras,
      total_dispositivos: loc.total_dispositivos,
      ultima_leitura: iso(loc.ultima_leitura),
      medias: {
        temperatura: arredondar(loc.temperatura, 1),
        humidade: arredondar(loc.humidade, 1),
      },
    };
  });

  // Formato do mapa na documentação não tem o envelope { sucesso, dados }
  res.json({
    gerado_em: iso(agora),
    periodo: { inicio: iso(inicio), fim: iso(fim) },
    legenda: LEGENDA,
    pontos,
  });
});

module.exports = { todas, meus, doEsp, ultima, mapa };
