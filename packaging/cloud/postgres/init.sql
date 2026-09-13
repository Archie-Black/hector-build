CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS v01d_log (
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  host TEXT NOT NULL DEFAULT 'osv01d',
  service TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  msg TEXT NOT NULL
);

SELECT create_hypertable('v01d_log', 'ts', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS v01d_metric (
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  labels JSONB NOT NULL DEFAULT '{}'::jsonb
);

SELECT create_hypertable('v01d_metric', 'ts', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS v01d_log_service_ts ON v01d_log (service, ts DESC);
CREATE INDEX IF NOT EXISTS v01d_metric_name_ts ON v01d_metric (name, ts DESC);

GRANT ALL ON ALL TABLES IN SCHEMA public TO CURRENT_USER;
