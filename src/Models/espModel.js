const db = require('../db');

const COLUNAS = 'id, mac, nome, latitude, longitude, token_esp, inserido, ultimo_envio';

// Retorna o ESP criado, ou null se o MAC já estava registrado
async function criar({ mac, nome, latitude, longitude, token_esp }) {
  const r = await db.query(
    `INSERT INTO esps (mac, nome, latitude, longitude, token_esp)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (mac) DO NOTHING
     RETURNING ${COLUNAS}`,
    [mac, nome, latitude, longitude, token_esp],
  );
  return r.rows[0] || null;
}

async function buscarPorToken(token) {
  const r = await db.query(`SELECT ${COLUNAS} FROM esps WHERE token_esp = $1`, [token]);
  return r.rows[0] || null;
}

// Grava a leitura e atualiza o ultimo_envio do ESP na mesma instrução (atômico)
async function registrarLeitura(espId, tempoLeitura, temperatura, humidade) {
  const r = await db.query(
    `WITH nova AS (
       INSERT INTO leituras (esp_id, tempo_leitura, temperatura, humidade)
       VALUES ($1, $2, $3, $4)
       RETURNING id, tempo_leitura, temperatura, humidade
     ), atualiza AS (
       UPDATE esps SET ultimo_envio = NOW() WHERE id = $1
     )
     SELECT * FROM nova`,
    [espId, tempoLeitura, temperatura, humidade],
  );
  return r.rows[0];
}

module.exports = { criar, buscarPorToken, registrarLeitura };
