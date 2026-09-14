# OS V01D Cloud Fabric

Zero Trust. Stateless app. Timescale for state. Traefik is the only mouth.

Domain: doomchat.ca · www.doomchat.ca · y.doomchat.ca · hx.doomchat.ca
Downloads: https://www.doomchat.ca/downloads/
Builder: DeltaKingZero · shareware, no rent

Hector English ops (implemented by packaging/cloud, spoken on the desk):

- "restart the website" → repair.sh
- "scale the website" → orchestrate.sh scale
- "backup the website" → backup.sh
- "restore the website" → restore.sh
- "replace website copies" → orchestrate.sh roll
- "alert the website" → alerts API / prometheus


```
                    [ Internet ]
                          |
                     :80 / :443
                          |
                   +------+------+
                   |   TRAEFIK   |  ACME, rate limit, STS
                   |  10.13.0.2  |
                   +------+------+
                          |  v01d_fabric  10.13.0.0/24  (internal)
          +---------------+---------------+----------------+
          |               |               |                |
   +------+-----+  +------+-----+  +------+-----+   +------+-----+
   |  OS V01D   |  | Timescale  |  |   Vector   |   | Prometheus |
   | 10.13.0.10 |  | 10.13.0.20 |  | 10.13.0.30 |   | 10.13.0.40 |
   +------+-----+  +------------+  +------------+   +------------+
          |
   +------+------+
   | WireGuard   |  10.13.1.0/24  bot-to-bot / second host
   | 10.13.0.3   |
   +-------------+
```

Nothing else binds a public port. Postgres is not on the internet. Prometheus is not on the internet. The docker socket is not mounted into Traefik.
