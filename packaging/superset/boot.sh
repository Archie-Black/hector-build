#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VENV="$ROOT/.venv-superset"
DATA="$ROOT/data"
export SUPERSET_CONFIG_PATH="$ROOT/packaging/superset/superset_config.py"
export FLASK_APP=superset
export SUPERSET_SECRET_KEY="${SUPERSET_SECRET_KEY:-hector-hx-apache-superset-local-key-32b}"
mkdir -p "$DATA"

if [ ! -x "$VENV/bin/superset" ]; then
  echo "Apache Superset venv missing. Run: python3 -m venv $VENV && $VENV/bin/pip install apache-superset==4.1.4"
  exit 1
fi

"$VENV/bin/python" -m pip install -q flask-cors pillow >/dev/null 2>&1 || true
"$VENV/bin/superset" db upgrade
# Admin exists for the warehouse process. The UI is public (AUTH_ROLE_PUBLIC=Admin).
"$VENV/bin/superset" fab create-admin \
  --username admin \
  --firstname Hector \
  --lastname Build \
  --email hector@localhost \
  --password hectorhx >/dev/null 2>&1 || true
"$VENV/bin/superset" init
"$VENV/bin/python" "$ROOT/packaging/memory/seed_warehouse.py" || true
"$VENV/bin/python" "$ROOT/packaging/superset/seed_metrics.py"
"$VENV/bin/python" "$ROOT/packaging/superset/seed_dashboard.py" || true

# No web login. Apache is the warehouse engine. Dashboards live in Spectral HX.
echo "Warehouse LIVE (internal). No login UI."
