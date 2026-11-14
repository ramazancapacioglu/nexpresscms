#!/usr/bin/env bash
# ==============================================================================
# NexPress CMS — 1-Tık Sunucu Güncelleme Betiği (Host / VPS / Git Update)
# ==============================================================================
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo -e "${CYAN}=== NexPress CMS Güncelleme Başlatılıyor ===${NC}"

echo -e "${YELLOW}[1/5] Git deposundan son değişiklikler çekiliyor...${NC}"
# Panelin ürettiği .htaccess izlenmez. Eski bir sürüm onu depoya almışsa,
# sunucudaki kopya pull'u "üzerine yazılır" diye keser. Silmek güvenli: nginx okumaz,
# sonraki kalıcı bağlantı kaydı dosyayı yeniden yazar.
rm -f apps/cms/public/.htaccess
git pull --ff-only

echo -e "${YELLOW}[2/5] Bağımlılıklar güncelleniyor...${NC}"
pnpm install --frozen-lockfile || pnpm install

echo -e "${YELLOW}[3/5] Veritabanı şema göçleri uygulanıyor...${NC}"
pnpm db:migrate

echo -e "${YELLOW}[4/5] Üretim derlemesi oluşturuluyor...${NC}"
pnpm build

echo -e "${YELLOW}[5/5] Sunucu süreci yeniden yükleniyor...${NC}"
if command -v pm2 >/dev/null 2>&1; then
    pm2 reload nexpress --update-env || pm2 restart nexpress
    echo -e "${GREEN}✓ PM2 süreci sıfır kesintiyle (zero-downtime) yeniden yüklendi.${NC}"
elif systemctl is-active --quiet nexpress 2>/dev/null; then
    sudo systemctl restart nexpress
    echo -e "${GREEN}✓ Systemd nexpress servisi yeniden başlatıldı.${NC}"
else
    echo -e "${YELLOW}PM2 veya systemd servisi bulunamadı. Lütfen sunucu sürecini elle yeniden başlatın.${NC}"
fi

# Tek seferlik içerik aktarımı. İşaret dosyası duruyorsa ve daha önce bitmediyse çalışır.
# Şablon ve tasarım kütüphanesi silinmez. Başarısız olursa işaret durur, sonraki güncelleme yeniden dener.
DONE_FLAG="$ROOT_DIR/.import-akinsoft-done"
ONCE="$ROOT_DIR/scripts/import-akinsoft-izmir.once"
if [ -f "$ONCE" ] && [ ! -f "$DONE_FLAG" ]; then
  echo -e "${YELLOW}Akınsoft İzmir içeriği aktarılıyor (şablon ve tasarım kütüphanesi durur)...${NC}"
  (cd "$ROOT_DIR/apps/cms" && pnpm exec tsx scripts/import-live-akinsoft.ts)
  touch "$DONE_FLAG"
  echo -e "${GREEN}✓ İçerik aktarımı bitti.${NC}"
fi

echo -e "${GREEN}=== NexPress CMS Güncellemesi Başarıyla Tamamlandı! ===${NC}"

