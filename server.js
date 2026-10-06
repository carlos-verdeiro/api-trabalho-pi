require('dotenv').config();

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Olá! A API do Trabalho PI está rodando perfeitamente!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Swagger disponível em http://localhost:${PORT}/api-docs`);
});