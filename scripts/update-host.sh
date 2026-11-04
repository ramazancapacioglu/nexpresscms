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
git pull

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

echo -e "${GREEN}=== NexPress CMS Güncellemesi Başarıyla Tamamlandı! ===${NC}"

