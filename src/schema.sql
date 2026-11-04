-- Executado automaticamente na inicialização da API (db.init).
-- Todos os comandos são idempotentes.

CREATE TABLE IF NOT EXISTS esps (
  id            SERIAL PRIMARY KEY,
  mac           VARCHAR(64)  NOT NULL UNIQUE,
  nome          VARCHAR(100),
  latitude      DOUBLE PRECISION NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
  longitude     DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  token_esp     VARCHAR(128) NOT NULL UNIQUE,
  inserido      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  ultimo_envio  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS apps (
  id        SERIAL PRIMARY KEY,
  app_token VARCHAR(128) NOT NULL UNIQUE,
  inserido  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vinculos (
  app_id   INTEGER     NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  esp_id   INTEGER     NOT NULL REFERENCES esps(id) ON DELETE CASCADE,
  inserido TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (app_id, esp_id)
);

CREATE TABLE IF NOT EXISTS leituras (
  id            SERIAL PRIMARY KEY,
  esp_id        INTEGER     NOT NULL REFERENCES esps(id) ON DELETE CASCADE,
  tempo_leitura TIMESTAMPTZ NOT NULL,
  temperatura   DOUBLE PRECISION NOT NULL,
  humidade      DOUBLE PRECISION NOT NULL,
  inserido      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leituras_esp_tempo ON leituras (esp_id, tempo_leitura DESC);
CREATE INDEX IF NOT EXISTS idx_leituras_tempo     ON leituras (tempo_leitura);
CREATE INDEX IF NOT EXISTS idx_vinculos_esp       ON vinculos (esp_id);
