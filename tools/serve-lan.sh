#!/usr/bin/env bash
# Serves this repo to your phone over the local network.
#
# Why plain HTTP and not the live site: Safari refuses to let an https page
# call a plain http address, and Ollama on your machine is plain http. Serving
# the app over http too keeps both on the same footing, so the phone can reach
# the local model. Run it from the machine that runs Ollama.
#
#   ./tools/serve-lan.sh          # port 8080
#   ./tools/serve-lan.sh 9000     # some other port

set -euo pipefail

PORT="${1:-8080}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Best guess at this machine's address on the network.
lan_ip() {
  if command -v ipconfig >/dev/null 2>&1; then
    for iface in en0 en1 en2; do
      ip=$(ipconfig getifaddr "$iface" 2>/dev/null || true)
      [ -n "$ip" ] && { echo "$ip"; return; }
    done
  fi
  if command -v ip >/dev/null 2>&1; then
    ip route get 1.1.1.1 2>/dev/null | awk '{for (i=1;i<=NF;i++) if ($i=="src") {print $(i+1); exit}}' && return
  fi
  hostname -I 2>/dev/null | awk '{print $1}'
}

IP="$(lan_ip || true)"
[ -n "${IP:-}" ] || IP="your-computer-ip"

cat <<BANNER

  The Foundry — serving to the local network
  ------------------------------------------

  On your iPhone, open Safari and go to:

      http://${IP}:${PORT}/foundry/

  Then: Share -> Add to Home Screen.

  To point it at the local model, open:

      http://${IP}:${PORT}/foundry/connect.html

  Ollama has to be listening on the network and has to allow this page.
  In another terminal, stop Ollama and start it like this:

      OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=http://${IP}:${PORT} ollama serve

  Phone and computer must be on the same Wi-Fi. Ctrl-C here to stop.

BANNER

if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$ROOT"
elif command -v npx >/dev/null 2>&1; then
  exec npx --yes serve -l "tcp://0.0.0.0:$PORT" "$ROOT"
else
  echo "Need python3 or npx to serve. Install either one." >&2
  exit 1
fi
