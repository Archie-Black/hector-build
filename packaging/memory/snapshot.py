#!/usr/bin/env python3
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path("/workspace/packaging/memory")))
from graph import connect, snapshot

print(json.dumps(snapshot(connect())))
