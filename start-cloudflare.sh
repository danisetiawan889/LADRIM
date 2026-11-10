#!/bin/bash
# Script untuk menjalankan LADRIM (Backend, Frontend, dan Cloudflare Tunnel)

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=== LADRIM Cloudflare Tunnel Runner ==="

cleanup() {
    echo ""
    echo "[*] Menghentikan LADRIM..."
    kill "$BACKEND_PID" "$FRONTEND_PID" "$CF_PID" 2>/dev/null || true
    fuser -k 3000/tcp 2>/dev/null || true
    fuser -k 4000/tcp 2>/dev/null || true
    pkill -f "cloudflared tunnel" 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# 1. Pastikan PostgreSQL berjalan
if ! pg_isready -q; then
    echo "[!] PostgreSQL belum berjalan. Memulai PostgreSQL..."
    sudo systemctl start postgresql 2>/dev/null || true
fi

# 2. Hentikan instance lama jika ada
echo "[*] Menghentikan proses lama di port 3000, 4000, dan cloudflared..."
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 4000/tcp 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 1

# 3. Jalankan Backend (Port 4000)
echo "[*] Memulai Backend (Express) di port 4000..."
cd "$DIR/backend"
npm run dev > "$DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "    Backend PID: $BACKEND_PID"

# Tunggu backend siap
sleep 2

# 4. Jalankan Frontend (Port 3000)
echo "[*] Memulai Frontend (Next.js) di port 3000..."
cd "$DIR/frontend"
npm run dev -- -p 3000 -H 0.0.0.0 > "$DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "    Frontend PID: $FRONTEND_PID"

# Tunggu frontend siap
echo "[*] Menunggu frontend siap..."
for i in {1..20}; do
    if curl -s http://127.0.0.1:3000 > /dev/null 2>&1; then
        echo "    Frontend siap!"
        break
    fi
    sleep 1
done

# 5. Jalankan Cloudflare Tunnel
echo "[*] Memulai Cloudflare Tunnel..."
cd "$DIR"
> "$DIR/cloudflare.log"
./bin/cloudflared tunnel --url http://127.0.0.1:3000 > "$DIR/cloudflare.log" 2>&1 &
CF_PID=$!
echo "    Cloudflare Tunnel PID: $CF_PID"

echo "[*] Menunggu URL Cloudflare Tunnel..."
URL=""
for i in {1..25}; do
    URL=$(grep -o 'https://[-a-z0-9.]*\.trycloudflare\.com' "$DIR/cloudflare.log" | head -n 1)
    if [ -n "$URL" ]; then
        break
    fi
    sleep 1
done

echo "=========================================================="
if [ -n "$URL" ]; then
    echo " LADRIM Berhasil Berjalan di Cloudflare Tunnel!"
    echo " Akses URL: $URL"
else
    echo " Tunnel sedang dibuat, cek $DIR/cloudflare.log untuk URL"
fi
echo "=========================================================="

# Keep alive so process runner doesn't kill the child processes
wait $CF_PID $BACKEND_PID $FRONTEND_PID
