#!/usr/bin/env bash
# Yerel WordPress'i kurar; ücretsiz Kadence tema/Blocks'u wordpress.org'dan, lisanslı paketleri /packages'tan yükler.
# Lisans etkinleştirmesini yönetici panelinden siz yaparsınız. Kullanım: ./setup.sh
set -uo pipefail
cd "$(dirname "$0")"
URL="${WP_URL:-http://localhost:8080}"
DOCKER=("${DOCKER:-docker}")
wp() { "${DOCKER[@]}" compose run --rm -T wpcli wp "$@"; }

"${DOCKER[@]}" compose up -d --wait db wordpress
# Paketler ve PHP ayarı istemci tarafından kopyalanır (WSL yolu bağlamaya gerek kalmaz; Docker Desktop WSL entegrasyonu şart değil).
WP_CID=$("${DOCKER[@]}" compose ps -q wordpress | tr -d '\r')
"${DOCKER[@]}" exec -u 0 "$WP_CID" mkdir -p /packages
"${DOCKER[@]}" cp ../../docs/kadence-referans-eklentiler/. "$WP_CID":/packages/
"${DOCKER[@]}" cp uploads.ini "$WP_CID":/usr/local/etc/php/conf.d/uploads.ini
"${DOCKER[@]}" exec -u 0 "$WP_CID" apachectl graceful
until curl -s -o /dev/null "$URL"; do sleep 2; done

if ! wp core is-installed 2>/dev/null; then
  wp core install --url="$URL" --title="Kadence Referans" --admin_user=admin --admin_password=admin --admin_email=admin@example.test --skip-email
  wp language core install tr_TR --activate || true
  wp rewrite structure '/%postname%/' --hard
fi

# Ücretsiz çekirdek: Kadence tema + Kadence Blocks (Pro'nun ön koşulu)
wp theme install kadence --activate
wp plugin install kadence-blocks --activate

# Lisanslı eklentiler (etkinleştirme başarısız olursa devam edilir; sebebi çıktıda görünür)
for z in ../../docs/kadence-referans-eklentiler/*.zip; do
  n=$(basename "$z"); z="/packages/$n"
  case "$n" in
    ascend-premium*|pinnacle-premium*|virtue-premium*|virtue-bold*)
      echo "== tema (yalnızca yüklenir): $n"; wp theme install "$z" || true ;;
    *)
      echo "== eklenti: $n"; wp plugin install "$z" --activate || wp plugin install "$z" || true ;;
  esac
done

wp plugin list
echo; echo "Hazır: $URL/wp-admin  (kullanıcı: admin / parola: admin)"
