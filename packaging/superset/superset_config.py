import os
from flask_appbuilder.security.manager import AUTH_DB

SECRET_KEY = os.environ.get(
    "SUPERSET_SECRET_KEY",
    "hector-hx-apache-superset-local-key-32b",
)
SQLALCHEMY_DATABASE_URI = os.environ.get(
    "SUPERSET_META_DB",
    "sqlite:////workspace/data/superset-meta.db",
)
WTF_CSRF_ENABLED = False
TALISMAN_ENABLED = False
ENABLE_CORS = True
ENABLE_PROXY_FIX = True
OVERRIDE_HTTP_HEADERS = {"X-Frame-Options": "ALLOWALL"}

# Local coding app. No second login. Warehouse is on the same machine as Hector.
AUTH_TYPE = AUTH_DB
AUTH_ROLE_PUBLIC = "Admin"
PUBLIC_ROLE_LIKE = "Admin"

FEATURE_FLAGS = {
    "EMBEDDED_SUPERSET": True,
    "ALERT_REPORTS": False,
    "SQLLAB_BACKEND_PERSISTENCE": True,
    "ENABLE_TEMPLATE_PROCESSING": True,
    "ALLOW_ADHOC_SUBQUERY": True,
    "ESTIMATE_QUERY_COST": True,
}
ROW_LIMIT = 5000
SUPERSET_WEBSERVER_TIMEOUT = 60
PREVENT_UNSAFE_DB_CONNECTIONS = False
