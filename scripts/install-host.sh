#!/usr/bin/env bash
# ==============================================================================
# NexPress CMS — Doğrudan Sunucu Kurulum Sihirbazı (Ubuntu / Debian / VPS / Host)
# ==============================================================================
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "=================================================================="
echo "          🚀 NexPress CMS — Sunucu Kurulum Sihirbazı              "
echo "        (Docker Gerektirmeyen Doğrudan VPS / Host Dağıtımı)        "
echo "=================================================================="
echo -e "${NC}"

# 1. Dizin tespiti
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# 2. Node.js Kontrolü (>= 20)
echo -e "${YELLOW}[1/7] Node.js sürümü kontrol ediliyor...${NC}"
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}HATA: Node.js bulunamadı! Lütfen Node.js 20 veya üzerini kurun.${NC}"
    echo "Hızlı kurulum (Ubuntu/Debian):"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

NODE_MAJOR=$(node -v | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 20 ]; then
    echo -e "${RED}HATA: Node.js sürümünüz ($NODE_MAJOR) çok eski. En az Node.js 20 gereklidir.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) hazır.${NC}"

# 3. pnpm Kontrolü
echo -e "${YELLOW}[2/7] pnpm paket yöneticisi kontrol ediliyor...${NC}"
if ! command -v pnpm >/dev/null 2>&1; then
    echo "pnpm bulunamadı, etkinleştiriliyor..."
    if command -v corepack >/dev/null 2>&1; then
        corepack enable
        corepack prepare pnpm@9.15.0 --activate || npm install -g pnpm
    else
        npm install -g pnpm
    fi
fi
echo -e "${GREEN}✓ pnpm $(pnpm -v) hazır.${NC}"

# 4. Ortam Değişkenleri (.env) Yapılandırması
echo -e "${YELLOW}[3/7] Ortam değişkenleri (.env) yapılandırılıyor...${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}Mevcut .env dosyası bulundu.${NC}"
    read -p "Mevcut .env dosyasını korumak istiyor musunuz? (E/h): " KEEP_ENV
    KEEP_ENV=${KEEP_ENV:-E}
else
    KEEP_ENV="h"
fi

if [[ "$KEEP_ENV" =~ ^[Hh]$ ]]; then
    echo ""
    echo "Lütfen kurulum parametrelerini girin (Varsayılan değer için Enter'a basın):"
    
    # Uygulama URL'i
    read -p "Alan adı / Uygulama Adresi [http://localhost:3000]: " APP_URL
    APP_URL=${APP_URL:-http://localhost:3000}
    
    # Port
    read -p "Çalışma Portu [3000]: " PORT_NUM
    PORT_NUM=${PORT_NUM:-3000}
    
    # PostgreSQL Bağlantısı
    echo -e "\n${CYAN}PostgreSQL (pgvector) Bağlantı Bilgisi:${NC}"
    echo "Örnek: postgresql://kullanici:parola@localhost:5432/nexpress_cms?sslmode=disable"
    read -p "DATABASE_URL: " PG_URL
    while [ -z "$PG_URL" ]; do
        echo -e "${RED}DATABASE_URL boş bırakılamaz!${NC}"
        read -p "DATABASE_URL: " PG_URL
    done

    # Yönetici Hesabı
    read -p "İlk Yönetici E-Postası [admin@nexpress.local]: " ADMIN_EMAIL
    ADMIN_EMAIL=${ADMIN_EMAIL:-admin@nexpress.local}
    
    DEFAULT_PASS=$(openssl rand -hex 6 2>/dev/null || date +%s | sha256sum | head -c 12)
    DEFAULT_PASS="Nex!${DEFAULT_PASS}9"
    read -p "İlk Yönetici Parolası [$DEFAULT_PASS]: " ADMIN_PASS
    ADMIN_PASS=${ADMIN_PASS:-$DEFAULT_PASS}

    # Güvenlik Anahtarları Üret
    AUTH_SECRET=$(openssl rand -base64 36 2>/dev/null || date +%s%N | sha256sum | base64 | head -c 48)
    SECRETS_KEY=$(openssl rand -base64 36 2>/dev/null || date +%s%N | sha256sum | base64 | head -c 48)
    CRON_SECRET=$(openssl rand -hex 16 2>/dev/null || date +%s | sha256sum | head -c 24)

    cat <<EOF > .env
# NexPress CMS Üretim Yapılandırması
NODE_ENV=production
PORT=${PORT_NUM}
CMS_MODE=single
NEXT_PUBLIC_APP_URL=${APP_URL}

# Veritabanı (PostgreSQL + pgvector)
DB_DIALECT=postgres
DATABASE_URL=${PG_URL}

# Güvenlik ve Kimlik Doğrulama
AUTH_SECRET=${AUTH_SECRET}
SECRETS_KEY=${SECRETS_KEY}
CRON_SECRET=${CRON_SECRET}

# İlk Yönetici Hesabı (İlk girişten sonra panelden parolanızı güncelleyebilirsiniz)
ADMIN_DEFAULT_EMAIL=${ADMIN_EMAIL}
ADMIN_DEFAULT_PASSWORD=${ADMIN_PASS}

# Dizinler
MEDIA_DIR=./data/media
BACKUP_DIR=./data/backups
LOG_DIR=./data/logs
EOF

    echo -e "${GREEN}✓ .env dosyası oluşturuldu.${NC}"
    echo -e "Yönetici e-postası: ${CYAN}${ADMIN_EMAIL}${NC}"
    echo -e "Yönetici parolası: ${CYAN}${ADMIN_PASS}${NC}"
    echo "Bu bilgileri bir yere not edin!"
fi

# Gerekli veri klasörlerini oluştur
mkdir -p data/media data/backups data/logs

# 5. Bağımlılıkların Kurulumu
echo -e "${YELLOW}[4/7] Monorepo bağımlılıkları kuruluyor (pnpm install)...${NC}"
pnpm install --frozen-lockfile || pnpm install
echo -e "${GREEN}✓ Bağımlılıklar başarıyla kuruldu.${NC}"

# 6. Veritabanı Göçleri (Migrations)
echo -e "${YELLOW}[5/7] PostgreSQL şema göçleri çalıştırılıyor (pnpm db:migrate)...${NC}"
pnpm db:migrate
echo -e "${GREEN}✓ Veritabanı şeması ve pgvector tabloları hazır.${NC}"

# Tohumlama (Seed)
read -p "Veritabanına başlangıç içeriği ve demo sayfaları yüklensin mi? (E/h): " DO_SEED
DO_SEED=${DO_SEED:-E}
if [[ "$DO_SEED" =~ ^[Ee]$ ]]; then
    echo "Başlangıç verisi ekleniyor (pnpm db:seed)..."
    pnpm db:seed || echo "Not: Seed zaten uygulanmış olabilir, devam ediliyor."
fi

# 7. Üretim Derlemesi (Next.js Build)
echo -e "${YELLOW}[6/7] Next.js üretim derlemesi alınıyor (pnpm build)...${NC}"
pnpm build
echo -e "${GREEN}✓ Derleme tamamlandı.${NC}"

# 8. Süreç Yöneticisi Başlatma (PM2)
echo -e "${YELLOW}[7/7] Süreç yöneticisi yapılandırılıyor...${NC}"
if command -v pm2 >/dev/null 2>&1; then
    echo "PM2 tespit edildi, uygulama başlatılıyor..."
    pm2 start ecosystem.config.cjs
    pm2 save
    echo -e "${GREEN}✓ NexPress CMS, PM2 ile arka planda çalıştırıldı.${NC}"
    echo "Komutlar: pm2 status, pm2 logs nexpress, pm2 reload nexpress"
else
    echo -e "${YELLOW}PM2 bulunamadı.${NC}"
    echo "Uygulamayı sürekli arka planda çalıştırmak için PM2 önerilir:"
    echo "  npm install -g pm2"
    echo "  pm2 start ecosystem.config.cjs && pm2 save && pm2 startup"
    echo ""
    echo "Veya doğrudan çalıştırmak için:"
    echo "  pnpm start"
fi

echo ""
echo -e "${GREEN}=================================================================="
echo "          🎉 TEBRİKLER! NEXPRESS CMS BAŞARIYLA KURULDU!           "
echo "==================================================================${NC}"
echo -e "Web Adresi: ${CYAN}${APP_URL:-http://localhost:3000}${NC}"
echo -e "Yönetim Paneli: ${CYAN}${APP_URL:-http://localhost:3000}/admin${NC}"
echo -e "Nginx Tersine Vekil Şablonu: ${YELLOW}scripts/nginx-nexpress.conf${NC}"
echo -e "Güncelleme Betiği: ${YELLOW}bash scripts/update-host.sh${NC}"
echo "=================================================================="
