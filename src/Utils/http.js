// Erro "esperado" da API: o handler central em server.js transforma em JSON.
class ErroApi extends Error {
  constructor(status, codigo, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

// Express 4 não captura erros de funções async sozinho
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function enviarErro(res, status, codigo, mensagem, detalhes) {
  const corpo = { sucesso: false, erro: codigo, mensagem };
  if (detalhes && detalhes.length) corpo.detalhes = detalhes;
  return res.status(status).json(corpo);
}

module.exports = { ErroApi, asyncHandler, enviarErro };
