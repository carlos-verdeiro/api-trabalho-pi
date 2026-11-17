const db = require('../db');

const { SENSORES } = require('../config');

const COLUNAS_LEITURA = `l.id, l.tempo_leitura, l.inserido, ${SENSORES.map((s) => `l.${s}`).join(', ')}`;

// escopo: { tipo: 'todos' }
//       | { tipo: 'esp', id }   -> leituras de um ESP
//       | { tipo: 'app', id }   -> leituras de todos os ESPs vinculados a um app
async function listar({ escopo, inicio, fim, ordem, limite, offset }) {
  const condicoes = [];
  const params = [];
  const add = (valor) => {
    params.push(valor);
    return `$${params.length}`;
  };

  if (escopo.tipo === 'esp') {
    condicoes.push(`l.esp_id = ${add(escopo.id)}`);
  } else if (escopo.tipo === 'app') {
    condicoes.push(`l.esp_id IN (SELECT esp_id FROM vinculos WHERE app_id = ${add(escopo.id)})`);
  }
  if (inicio) condicoes.push(`l.tempo_leitura >= ${add(inicio)}`);
  if (fim) condicoes.push(`l.tempo_leitura <= ${add(fim)}`);

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  const direcao = ordem === 'asc' ? 'ASC' : 'DESC'; // valor controlado, nunca vem direto do usuário

  const contagem = await db.query(`SELECT COUNT(*)::int AS total FROM leituras l ${where}`, params);

  const pLimite = add(limite);
  const pOffset = add(offset);
  const r = await db.query(
    `SELECT ${COLUNAS_LEITURA}
       FROM leituras l
       ${where}
      ORDER BY l.tempo_leitura ${direcao}, l.id ${direcao}
      LIMIT ${pLimite} OFFSET ${pOffset}`,
    params,
  );

  return { linhas: r.rows, total: contagem.rows[0].total };
}

async function ultima(espId) {
  const r = await db.query(
    `SELECT ${COLUNAS_LEITURA}
       FROM leituras l
      WHERE l.esp_id = $1
      ORDER BY l.tempo_leitura DESC, l.id DESC
      LIMIT 1`,
    [espId],
  );
  return r.rows[0] || null;
}

// Mapa de calor: agrupa os ESPs em "localidades" (células de grade, arredondando
// latitude/longitude em `casasDecimais`) e calcula a média das leituras de cada uma.
// 1º nível: média por ESP; 2º nível: junta os ESPs da mesma célula ponderando pelo
// número de leituras (equivale à média de todas as leituras da célula).
// Cada sensor tem a própria contagem (n_<sensor>) porque leituras antigas podem ter
// colunas nulas (ex.: antes de existirem pm25/pm10/mq135) e AVG ignora nulos.
// SENSORES é uma constante do config.js, nunca vem do usuário.
async function agregarMapa({ inicio, fim, casasDecimais }) {
  const porEsp = SENSORES
    .map((s) => `AVG(l.${s}) AS ${s}, COUNT(l.${s})::int AS n_${s}`)
    .join(',\n              ');
  const medias = SENSORES
    .map((s) => `SUM(${s} * n_${s}) / NULLIF(SUM(n_${s}), 0) AS ${s}`)
    .join(',\n            ');

  const r = await db.query(
    `WITH por_esp AS (
       SELECT e.id,
              e.latitude,
              e.longitude,
              COUNT(*)::int          AS total_leituras,
              ${porEsp},
              MAX(l.tempo_leitura)   AS ultima_leitura
         FROM leituras l
         JOIN esps e ON e.id = l.esp_id
        WHERE l.tempo_leitura >= $1 AND l.tempo_leitura <= $2
        GROUP BY e.id
     )
     SELECT AVG(latitude)                AS latitude,
            AVG(longitude)               AS longitude,
            SUM(total_leituras)::int     AS total_leituras,
            COUNT(*)::int                AS total_dispositivos,
            MAX(ultima_leitura)          AS ultima_leitura,
            ${medias}
       FROM por_esp
      GROUP BY ROUND(latitude::numeric,  $3::int),
               ROUND(longitude::numeric, $3::int)
      ORDER BY 1, 2`,
    [inicio, fim, casasDecimais],
  );
  return r.rows;
}

module.exports = { listar, ultima, agregarMapa };
