const crypto = require('crypto');
const espModel = require('../Models/espModel');
const mobileModel = require('../Models/mobileModel');
const { ErroApi, asyncHandler } = require('../Utils/http');
const { iso, statusDoEsp } = require('../Utils/formatacao');

// POST /mobile/cadastrar
// Sem token -> cria o app e devolve app_token (201). Com token válido -> lista os ESPs (200).
const cadastrar = asyncHandler(async (req, res) => {
  if (req.mobile) {
    const esps = await mobileModel.listarEsps(req.mobile.id);
    return res.json({
      sucesso: true,
      dados: {
        dispositivos: esps.map((e) => ({
          token_esp: e.token_esp,
          nome: e.nome,
          status: statusDoEsp(e.ultimo_envio),
        })),
      },
    });
  }

  const appToken = crypto.randomBytes(32).toString('hex');
  await mobileModel.criarApp(appToken);
  return res.status(201).json({
    sucesso: true,
    mensagem: 'Dispositivo mobile cadastrado com sucesso',
    dados: { app_token: appToken },
  });
});

// GET /mobile/meu
const meus = asyncHandler(async (req, res) => {
  const esps = await mobileModel.listarEsps(req.mobile.id);
  res.json({
    sucesso: true,
    dados: {
      dispositivos: esps.map((e) => ({
        token_esp: e.token_esp,
        nome: e.nome,
        latitude: e.latitude,
        longitude: e.longitude,
        status: statusDoEsp(e.ultimo_envio),
        ultimo_envio: iso(e.ultimo_envio),
      })),
    },
  });
});

// POST /mobile/vincular   body: { token_esp }
const vincular = asyncHandler(async (req, res) => {
  const { token_esp: tokenEsp } = req.body || {};
  if (typeof tokenEsp !== 'string' || tokenEsp.trim() === '') {
    throw new ErroApi(400, 'VALIDATION_ERROR', 'Campos obrigatórios ausentes ou inválidos', ['token_esp é obrigatório']);
  }

  const esp = await espModel.buscarPorToken(tokenEsp.trim());
  if (!esp) throw new ErroApi(404, 'DEVICE_NOT_FOUND', 'Dispositivo não encontrado');

  await mobileModel.vincular(req.mobile.id, esp.id);
  res.json({ sucesso: true, mensagem: 'Dispositivo vinculado com sucesso' });
});

// DELETE /mobile/:token_esp/desvincular
const desvincular = asyncHandler(async (req, res) => {
  const removido = await mobileModel.desvincular(req.mobile.id, req.params.token_esp);
  if (!removido) throw new ErroApi(404, 'DEVICE_NOT_FOUND', 'Dispositivo não encontrado');

  res.json({ sucesso: true, mensagem: 'Dispositivo desvinculado com sucesso' });
});

module.exports = { cadastrar, meus, vincular, desvincular };
