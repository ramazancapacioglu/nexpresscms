#!/usr/bin/env bash
# Yerel WordPress'i kurar; ücretsiz Kadence tema/Blocks'u wordpress.org'dan, lisanslı paketleri /packages'tan yükler.
# Lisans etkinleştirmesini yönetici panelinden siz yaparsınız. Kullanım: ./setup.sh
set -uo pipefail
cd "$(dirname "$0")"
URL="${WP_URL:-http://localhost:8080}"
wp() { docker compose run --rm -T wpcli wp "$@"; }

docker compose up -d --wait db wordpress
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
for z in /packages/*.zip; do
  n=$(basename "$z")
  case "$n" in
    ascend-premium*|pinnacle-premium*|virtue-premium*|virtue-bold*)
      echo "== tema (yalnızca yüklenir): $n"; wp theme install "$z" || true ;;
    *)
      echo "== eklenti: $n"; wp plugin install "$z" --activate || wp plugin install "$z" || true ;;
  esac
done

wp plugin list
echo; echo "Hazır: $URL/wp-admin  (kullanıcı: admin / parola: admin)"
