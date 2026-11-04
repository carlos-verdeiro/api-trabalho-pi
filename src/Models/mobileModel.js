const db = require('../db');

async function criarApp(appToken) {
  const r = await db.query(
    'INSERT INTO apps (app_token) VALUES ($1) RETURNING id',
    [appToken],
  );
  return r.rows[0];
}

async function buscarAppPorToken(token) {
  const r = await db.query('SELECT id FROM apps WHERE app_token = $1', [token]);
  return r.rows[0] || null;
}

// ESPs vinculados a um app
async function listarEsps(appId) {
  const r = await db.query(
    `SELECT e.token_esp, e.nome, e.latitude, e.longitude, e.ultimo_envio
       FROM vinculos v
       JOIN esps e ON e.id = v.esp_id
      WHERE v.app_id = $1
      ORDER BY v.inserido, e.id`,
    [appId],
  );
  return r.rows;
}

// Retorna o ESP somente se estiver vinculado ao app (senão null)
async function buscarEspDoApp(appId, tokenEsp) {
  const r = await db.query(
    `SELECT e.id, e.token_esp, e.nome
       FROM esps e
       JOIN vinculos v ON v.esp_id = e.id
      WHERE v.app_id = $1 AND e.token_esp = $2`,
    [appId, tokenEsp],
  );
  return r.rows[0] || null;
}

// Vincular é idempotente: vincular de novo o mesmo ESP não gera erro
async function vincular(appId, espId) {
  await db.query(
    `INSERT INTO vinculos (app_id, esp_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [appId, espId],
  );
}

// Retorna true se existia vínculo e foi removido
async function desvincular(appId, tokenEsp) {
  const r = await db.query(
    `DELETE FROM vinculos v
      USING esps e
      WHERE v.esp_id = e.id AND v.app_id = $1 AND e.token_esp = $2`,
    [appId, tokenEsp],
  );
  return r.rowCount > 0;
}

module.exports = {
  criarApp, buscarAppPorToken, listarEsps, buscarEspDoApp, vincular, desvincular,
};
