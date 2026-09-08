"""Create the Spectral HX dashboard inside Apache Superset."""
from __future__ import annotations

import json
import os

os.environ.setdefault("SUPERSET_CONFIG_PATH", "/workspace/packaging/superset/superset_config.py")
os.environ.setdefault("FLASK_APP", "superset")
os.environ.setdefault("SUPERSET_SECRET_KEY", "hector-hx-apache-superset-local-key-32b")

from superset.app import create_app

URI = "sqlite:////workspace/data/hx-metrics.db"


def main() -> None:
    app = create_app()
    with app.app_context():
        from superset import db
        from superset.connectors.sqla.models import SqlaTable, SqlMetric, TableColumn
        from superset.models.core import Database
        from superset.models.dashboard import Dashboard
        from superset.models.slice import Slice

        database = db.session.query(Database).filter_by(database_name="HX Metrics").first()
        if not database:
            database = Database(database_name="HX Metrics")
            database.set_sqlalchemy_uri(URI)
            db.session.add(database)
            db.session.commit()

        sqlite_db = database
        sqlite_db.expose_in_sqllab = True
        duck = db.session.query(Database).filter_by(database_name="HX Warehouse").first()
        if not duck:
            duck = Database(database_name="HX Warehouse")
            duck.set_sqlalchemy_uri("duckdb:////workspace/data/hx-warehouse.duckdb")
            duck.expose_in_sqllab = True
            db.session.add(duck)
        db.session.commit()

        def table(name: str) -> SqlaTable:
            existing = (
                db.session.query(SqlaTable)
                .filter_by(table_name=name, database_id=database.id)
                .first()
            )
            if existing:
                return existing
            t = SqlaTable(table_name=name, database=database, schema=None)
            db.session.add(t)
            db.session.commit()
            if name == "hx_jobs":
                t.columns = [
                    TableColumn(column_name="id", type="STRING"),
                    TableColumn(column_name="at", type="INT"),
                    TableColumn(column_name="voice", type="STRING"),
                    TableColumn(column_name="prompt", type="STRING"),
                    TableColumn(column_name="ok", type="INT"),
                    TableColumn(column_name="spend", type="INT"),
                    TableColumn(column_name="lanes", type="INT"),
                ]
                t.metrics = [SqlMetric(metric_name="count", expression="COUNT(*)")]
            db.session.commit()
            return t

        jobs = table("hx_jobs")
        table("hx_lanes")
        table("hx_traces")

        def chart(title: str, viz: str, params: dict) -> Slice:
            existing = db.session.query(Slice).filter_by(slice_name=title).first()
            if existing:
                return existing
            sl = Slice(
                slice_name=title,
                datasource_type="table",
                datasource_id=jobs.id,
                viz_type=viz,
                params=json.dumps(params),
            )
            db.session.add(sl)
            db.session.commit()
            return sl

        c1 = chart(
            "HX jobs",
            "big_number_total",
            {"metric": "count", "header_font_size": 0.4},
        )
        dash = db.session.query(Dashboard).filter_by(dashboard_title="Spectral HX").first()
        if not dash:
            dash = Dashboard(dashboard_title="Spectral HX", slug="spectral-hx")
            dash.slices = [c1]
            db.session.add(dash)
            db.session.commit()
        print("LIVE Superset dashboard: Spectral HX")


if __name__ == "__main__":
    main()
