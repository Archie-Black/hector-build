#!/usr/bin/env bash
# OS V01D cloud fabric. Idempotent. Zero Trust. No human in the loop after DNS.
set -euo pipefail

CLOUD="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$CLOUD/../.." && pwd)"
PREFIX="${V01D_CLOUD_PREFIX:-/opt/osv01d/cloud}"
COMPOSE_BIN=""

say() { printf 'v01d-cloud: %s\n' "$*"; }

detect() {
  ARCH="$(uname -m)"
  case "$ARCH" in
    x86_64|amd64) ARCH=amd64 ;;
    aarch64|arm64) ARCH=arm64 ;;
    *) say "unsupported arch $ARCH"; exit 1 ;;
  esac
  RAM_KB="$(awk '/MemTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo 0)"
  RAM_GB=$((RAM_KB / 1024 / 1024))
  KERNEL="$(uname -r)"
  say "arch=$ARCH ram=${RAM_GB}G kernel=$KERNEL"
  if [ "$RAM_GB" -lt 2 ]; then
    say "need at least 2G RAM"
    exit 1
  fi
}

need_root() {
  if [ "$(id -u)" -ne 0 ]; then
    say "run as root on the VPS (or OS V01D host)"
    exit 1
  fi
}

pin_docker() {
  if command -v docker >/dev/null 2>&1; then
    say "docker already present"
  elif command -v pacman >/dev/null 2>&1; then
    pacman -Sy --needed --noconfirm docker docker-compose || true
    systemctl enable --now docker || true
  elif command -v apt-get >/dev/null 2>&1; then
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg openssl wireguard
    install -m 0755 -d /etc/apt/keyrings
    if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      chmod a+r /etc/apt/keyrings/docker.gpg
    fi
    . /etc/os-release
    echo "deb [arch=$ARCH signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin
    systemctl enable --now docker
  else
    say "install docker by hand, then re-run"
    exit 1
  fi
  if docker compose version >/dev/null 2>&1; then
    COMPOSE_BIN="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_BIN="docker-compose"
  else
    say "docker compose plugin missing"
    exit 1
  fi
}

lock_net() {
  if command -v ufw >/dev/null 2>&1; then
    ufw default deny incoming || true
    ufw default allow outgoing || true
    ufw allow OpenSSH || ufw allow 22/tcp || true
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
    ufw allow 51820/udp || true
    ufw --force enable || true
  elif command -v iptables >/dev/null 2>&1; then
    iptables -C INPUT -p tcp --dport 22 -j ACCEPT 2>/dev/null || iptables -A INPUT -p tcp --dport 22 -j ACCEPT
    iptables -C INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || iptables -A INPUT -p tcp --dport 80 -j ACCEPT
    iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || iptables -A INPUT -p tcp --dport 443 -j ACCEPT
  fi
}

secrets() {
  mkdir -p "$PREFIX" /etc/wireguard
  umask 077
  if [ ! -f "$PREFIX/.env" ]; then
    PG_PASS="$(openssl rand -hex 32)"
    JWT="$(openssl rand -hex 32)"
    cat > "$PREFIX/.env" <<EOF
DOMAIN=doomchat.ca
ACME_EMAIL=Deltakingzero@doomchat.ca
PG_USER=v01d
PG_PASS=${PG_PASS}
PG_DB=v01d
JWT_SECRET=${JWT}
V01D_FABRIC=10.13.0.0/24
V01D_MESH=10.13.1.0/24
EOF
    say "wrote $PREFIX/.env"
  fi
  chmod 600 "$PREFIX/.env"
  if [ ! -f /etc/wireguard/v01d.key ]; then
    if command -v wg >/dev/null 2>&1; then
      wg genkey | tee /etc/wireguard/v01d.key | wg pubkey > /etc/wireguard/v01d.pub
    else
      openssl rand -base64 32 > /etc/wireguard/v01d.key
      openssl rand -base64 32 > /etc/wireguard/v01d.pub
    fi
    chmod 600 /etc/wireguard/v01d.key
  fi
}

plant() {
  mkdir -p "$PREFIX" "$PREFIX/metrics"
  rsync -a --delete \
    --exclude .env \
    --exclude '.env.*' \
    "$CLOUD"/ "$PREFIX"/
  KEY="$(tr -d '\n' < /etc/wireguard/v01d.key)"
  sed "s|PrivateKey = REPLACE_ME|PrivateKey = ${KEY}|" "$CLOUD/wireguard/wg0.conf" > "$PREFIX/wireguard/wg0.conf"
  chmod 600 "$PREFIX/wireguard/wg0.conf"
  ln -sfn "$PREFIX/wireguard/wg0.conf" /etc/wireguard/wg0.conf
  mkdir -p /etc/traefik
  ln -sfn "$PREFIX/traefik/traefik.yml" /etc/traefik/traefik.yml
  ln -sfn "$PREFIX/traefik/dynamic.yml" /etc/traefik/dynamic.yml
  if [ -d /etc/systemd/system ]; then
    cp "$CLOUD/osv01d-heal.service" /etc/systemd/system/osv01d-heal.service
    cp "$CLOUD/osv01d-heal.timer" /etc/systemd/system/osv01d-heal.timer
    systemctl daemon-reload || true
    systemctl enable --now osv01d-heal.timer || true
  fi
}

up() {
  cd "$PREFIX"
  PROFILE=()
  if [ -e /dev/net/tun ]; then
    PROFILE=(--profile wireguard)
  fi
  # shellcheck disable=SC2086
  $COMPOSE_BIN --env-file .env "${PROFILE[@]}" up -d --build --remove-orphans
}

main() {
  need_root
  detect
  pin_docker
  lock_net
  secrets
  plant
  up
  bash "$CLOUD/verify_cloud.sh" "$PREFIX" || say "verify reported issues — read the log"
  say "edge is 80/443. fabric is 10.13.0.0/24. point doomchat.ca here."
}

main "$@"
