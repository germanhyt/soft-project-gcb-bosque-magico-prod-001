#!/usr/bin/env bash
# Aplica nginx HTTP → certbot → HTTPS para dominios prod Bosque.
# Ejecutar EN EL VPS como root, con contenedores prod arriba:
#   bash scripts/vps-apply-nginx-prod-bosque.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NGINX_CONF="${NGINX_CONF:-/home/projects/shared/nginx.conf}"
HTTP_SNIP="$ROOT/deploy/nginx-prod-bosque-http.snippet.conf"
HTTPS_SNIP="$ROOT/deploy/nginx-prod-bosque-https.snippet.conf"
MARKER_HTTP="# ========== PROD BOSQUE MAGICO (HTTP + ACME) =========="
MARKER_HTTPS="# ========== PROD BOSQUE MAGICO (HTTPS) =========="
WEBROOT="/home/projects/shared/webroot"

insert_before_panini() {
  local snip="$1"
  local tmp
  tmp="$(mktemp)"
  if grep -q "# --- Panini Tracker" "$NGINX_CONF"; then
    awk -v snip="$snip" '
      /# --- Panini Tracker/ && !done {
        while ((getline line < snip) > 0) print line;
        close(snip);
        print "";
        done=1
      }
      { print }
    ' "$NGINX_CONF" > "$tmp"
  else
    cat "$NGINX_CONF" > "$tmp"
    printf '\n' >> "$tmp"
    cat "$snip" >> "$tmp"
  fi
  mv "$tmp" "$NGINX_CONF"
}

reload_nginx() {
  docker exec nginx_proxy nginx -t
  docker exec nginx_proxy nginx -s reload
}

cp -a "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%Y%m%d%H%M%S)"

if ! grep -qF "$MARKER_HTTP" "$NGINX_CONF"; then
  echo "==> Insertando bloque HTTP prod"
  insert_before_panini "$HTTP_SNIP"
  reload_nginx
else
  echo "==> Bloque HTTP prod ya presente"
fi

CERT_LIVE="/home/projects/shared/letsencrypt/live/bosquemagico.gcbprojects.site"
if [ ! -f "$CERT_LIVE/fullchain.pem" ]; then
  echo "==> Certbot (webroot $WEBROOT)"
  mkdir -p "$WEBROOT"
  docker run --rm \
    -v /home/projects/shared/letsencrypt:/etc/letsencrypt \
    -v "$WEBROOT:/usr/share/nginx/html" \
    certbot/certbot certonly --webroot -w /usr/share/nginx/html \
    -d bosquemagico.gcbprojects.site \
    -d admin.bosquemagico.gcbprojects.site \
    --email admin@gcbprojects.site --agree-tos --non-interactive
else
  echo "==> Certificado ya existe"
fi

if [ ! -f "$CERT_LIVE/fullchain.pem" ]; then
  echo "ERROR: no hay certificado en $CERT_LIVE"
  exit 1
fi

if ! grep -qF "$MARKER_HTTPS" "$NGINX_CONF"; then
  echo "==> Insertando bloque HTTPS prod"
  insert_before_panini "$HTTPS_SNIP"
  reload_nginx
else
  echo "==> Bloque HTTPS prod ya presente"
  reload_nginx
fi

echo "==> Smoke HTTPS"
curl -sfI "https://bosquemagico.gcbprojects.site/" | head -8
curl -sfI "https://admin.bosquemagico.gcbprojects.site/" | head -8
curl -sf "https://admin.bosquemagico.gcbprojects.site/api/health"
echo
echo "OK — nginx prod bosque listo"
