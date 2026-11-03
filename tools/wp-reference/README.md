# Yerel WordPress referans ortamı

Lisanslı referans eklenti ve temaların davranışını canlı incelemek içindir. Paketler `docs/kadence-referans-eklentiler/` altındadır ve **depoya girmez** (`.gitignore`).

1. Docker Desktop açık olmalı. WSL entegrasyonu kapalıysa Windows'un `docker.exe`'si kullanılabilir: `DOCKER="/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe" ./setup.sh` (paketler bağlama yerine `docker cp` ile kopyalanır).
2. `./setup.sh` — WordPress'i `http://localhost:8080` üzerinde kurar (yönetici: `admin` / `admin`), ücretsiz tema ve blok eklentisini wordpress.org'dan, lisanslı paketleri `/packages` bağlamından yükler.
3. Lisansları yönetici panelinden siz etkinleştirirsiniz.

Sıfırlamak için: `docker compose down -v`.
