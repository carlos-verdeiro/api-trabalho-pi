require('dotenv').config();
const express = require('express');
const db = require('./db');
const esp32Routes = require('./Routes/esp32Routes');
const mobileRoutes = require('./Routes/mobileRoutes');
const { ErroApi, enviarErro } = require('./Utils/http');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Olá! A API do Trabalho PI está rodando perfeitamente!');
});

app.get('/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ status: 'ok', db_time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'erro', message: err.message });
  }
});

app.use('/esp32', esp32Routes);
app.use('/mobile', mobileRoutes);

// Rota inexistente
app.use((req, res) => {
  enviarErro(res, 404, 'NOT_FOUND', 'Rota não encontrada');
});

// Tratamento central de erros
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof ErroApi) {
    return enviarErro(res, err.status, err.codigo, err.message, err.detalhes);
  }
  if (err.type === 'entity.parse.failed') {
    return enviarErro(res, 400, 'VALIDATION_ERROR', 'JSON inválido no corpo da requisição');
  }
  console.error('Erro não tratado:', err);
  return enviarErro(res, 500, 'INTERNAL_ERROR', 'Erro interno do servidor');
});

async function iniciar() {
  try {
    await db.init();
  } catch (err) {
    console.error('Falha ao preparar o banco de dados:', err.message);
    process.exit(1);
  }
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
}

if (require.main === module) {
  iniciar();
}

module.exports = app;
