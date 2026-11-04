const espModel = require('../Models/espModel');
const mobileModel = require('../Models/mobileModel');
const { ErroApi, asyncHandler } = require('../Utils/http');

// Lê "Authorization: Bearer <token>".
// Retorna: null  = header ausente
//          ''    = header presente, mas malformado
//          token = o token informado
function lerBearer(req) {
  const cabecalho = req.headers.authorization;
  if (!cabecalho) return null;
  const partes = cabecalho.trim().split(/\s+/);
  if (partes.length !== 2 || partes[0].toLowerCase() !== 'bearer') return '';
  return partes[1];
}

// Rotas do ESP32 -> preenche req.esp
const autenticarEsp = asyncHandler(async (req, res, next) => {
  const token = lerBearer(req);
  const esp = token ? await espModel.buscarPorToken(token) : null;
  if (!esp) throw new ErroApi(401, 'INVALID_TOKEN', 'Token de dispositivo ausente ou inválido');
  req.esp = esp;
  next();
});

// Rotas privadas do app -> preenche req.mobile
const autenticarApp = asyncHandler(async (req, res, next) => {
  const token = lerBearer(req);
  const mobile = token ? await mobileModel.buscarAppPorToken(token) : null;
  if (!mobile) throw new ErroApi(401, 'INVALID_TOKEN', 'Token ausente, inválido ou expirado');
  req.mobile = mobile;
  next();
});

// POST /mobile/cadastrar -> sem header: segue (req.mobile = null); com header: precisa ser válido
const appOpcional = asyncHandler(async (req, res, next) => {
  const token = lerBearer(req);
  if (token === null) {
    req.mobile = null;
    return next();
  }
  const mobile = token ? await mobileModel.buscarAppPorToken(token) : null;
  if (!mobile) throw new ErroApi(401, 'INVALID_TOKEN', 'Token inválido ou expirado');
  req.mobile = mobile;
  return next();
});

module.exports = { autenticarEsp, autenticarApp, appOpcional };
