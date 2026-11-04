const crypto = require('crypto');
const espModel = require('../Models/espModel');
const { ErroApi, asyncHandler } = require('../Utils/http');
const { ehNumero, parseIso } = require('../Utils/validacao');
const { iso, statusDoEsp } = require('../Utils/formatacao');
const { SENSORES, LIMITES_SENSOR, TOLERANCIA_FUTURO_MS } = require('../config');

// POST /esp32/registrar
const registrar = asyncHandler(async (req, res) => {
  const { mac, nome, latitude, longitude } = req.body || {};
  const detalhes = [];

  if (typeof mac !== 'string' || mac.trim() === '') {
    detalhes.push('mac é obrigatório');
  } else if (mac.trim().length > 64) {
    detalhes.push('mac deve ter no máximo 64 caracteres');
  }
  if (nome !== undefined && nome !== null && (typeof nome !== 'string' || nome.length > 100)) {
    detalhes.push('nome deve ser um texto de até 100 caracteres');
  }
  if (!ehNumero(latitude) || latitude < -90 || latitude > 90) {
    detalhes.push('latitude deve ser double entre -90 e 90');
  }
  if (!ehNumero(longitude) || longitude < -180 || longitude > 180) {
    detalhes.push('longitude deve ser double entre -180 e 180');
  }
  if (detalhes.length) {
    throw new ErroApi(400, 'VALIDATION_ERROR', 'Campos obrigatórios ausentes ou inválidos', detalhes);
  }

  let esp = await espModel.buscarPorMac(mac);
  if(esp){
    res.status(201).json({
      sucesso: true,
      mensagem: 'Dispositivo já cadastrado',
      dados: {
        mac: esp.mac,
        nome: esp.nome,
        latitude: esp.latitude,
        longitude: esp.longitude,
        token_esp: esp.token_esp,
        codigo_auth: esp.codigo_auth,
        inserido: iso(esp.inserido),
      },
    });
  }else{
    esp = await espModel.criar({
      mac: mac.trim(),
      nome: nome ? nome.trim() : null,
      latitude,
      longitude,
      token_esp: crypto.randomBytes(32).toString('hex'),
      codigo_auth: crypto.randomBytes(2).toString('hex').toUpperCase(),
    });

    res.status(201).json({
      sucesso: true,
      mensagem: 'Dispositivo criado com sucesso',
      dados: {
        mac: esp.mac,
        nome: esp.nome,
        latitude: esp.latitude,
        longitude: esp.longitude,
        token_esp: esp.token_esp,
        codigo_auth: esp.codigo_auth,
        inserido: iso(esp.inserido),
      },
    });
  }
});

// POST /esp32/leitura   (req.esp vem do middleware autenticarEsp)
const enviarLeitura = asyncHandler(async (req, res) => {
  const { token_esp: tokenCorpo, tempo_leitura: tempoCorpo, leituras } = req.body || {};

  // O header é quem autentica; se o corpo trouxer token_esp, tem que ser o mesmo
  if (tokenCorpo !== undefined && tokenCorpo !== req.esp.token_esp) {
    throw new ErroApi(401, 'INVALID_TOKEN', 'Token de dispositivo inválido');
  }

  const detalhes = [];

  const tempo = parseIso(tempoCorpo);
  if (!tempo) {
    detalhes.push('tempo_leitura é obrigatório e deve estar no formato ISO 8601');
  } else if (tempo.getTime() > Date.now() + TOLERANCIA_FUTURO_MS) {
    detalhes.push('tempo_leitura não pode estar no futuro');
  }

  if (leituras === null || typeof leituras !== 'object' || Array.isArray(leituras)
      || Object.keys(leituras).length === 0) {
    detalhes.push('leituras é obrigatório e não pode ser vazio');
  } else {
    Object.keys(leituras).forEach((chave) => {
      if (!SENSORES.includes(chave)) detalhes.push(`sensor desconhecido: ${chave}`);
    });
    SENSORES.forEach((sensor) => {
      const [min, max] = LIMITES_SENSOR[sensor];
      const valor = leituras[sensor];
      if (!ehNumero(valor) || valor < min || valor > max) {
        detalhes.push(`leituras.${sensor} deve ser um número entre ${min} e ${max}`);
      }
    });
  }

  if (detalhes.length) {
    throw new ErroApi(400, 'VALIDATION_ERROR', 'Dados inválidos ou leituras vazio', detalhes);
  }

  const leitura = await espModel.registrarLeitura(
    req.esp.id,
    tempo,
    leituras.temperatura,
    leituras.humidade,
  );

  res.status(201).json({
    sucesso: true,
    mensagem: 'Leitura registrada com sucesso',
    dados: {
      id_leitura: leitura.id,
      token_esp: req.esp.token_esp,
      tempo_leitura: iso(leitura.tempo_leitura),
      leituras: {
        temperatura: leitura.temperatura,
        humidade: leitura.humidade,
      },
    },
  });
});

// GET /esp32/status
const status = asyncHandler(async (req, res) => {
  res.json({
    sucesso: true,
    dados: {
      token_esp: req.esp.token_esp,
      nome: req.esp.nome,
      status: statusDoEsp(req.esp.ultimo_envio),
      ultimo_envio: iso(req.esp.ultimo_envio),
    },
  });
});

module.exports = { registrar, enviarLeitura, status };
