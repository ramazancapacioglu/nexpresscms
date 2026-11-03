# Yerel WordPress referans ortamı

Lisanslı referans eklenti ve temaların davranışını canlı incelemek içindir. Paketler `docs/kadence-referans-eklentiler/` altındadır ve **depoya girmez** (`.gitignore`).

1. Docker Desktop açık olmalı ve *Settings → Resources → WSL integration* içinde bu dağıtım (Ubuntu) etkin olmalı.
2. `./setup.sh` — WordPress'i `http://localhost:8080` üzerinde kurar (yönetici: `admin` / `admin`), ücretsiz tema ve blok eklentisini wordpress.org'dan, lisanslı paketleri `/packages` bağlamından yükler.
3. Lisansları yönetici panelinden siz etkinleştirirsiniz.

Sıfırlamak için: `docker compose down -v`.
