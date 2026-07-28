# Development Guide

## 1. Menambahkan Fitur Dynamic Variable Extraction
Fitur ini telah diimplementasikan di `automation/src/runner.ts` dan `automation/src/actions.ts`.

### Cara Kerjanya:
1. Saat UI mengatur `extractVar` (misal `otp`) dan `extractRegex` (misal `Kode: (\d+)`) pada step `waitForResponse`.
2. Playwright akan menunggu pesan baru yang masuk di layar obrolan WhatsApp.
3. Setelah pesan ditemukan, kode mengeksekusi regex pada pesan tersebut.
4. Jika cocok, variabel disimpan ke *global variables pool*: `variables["otp"] = "1234"`.
5. Saat eksekusi step selanjutnya (misal `sendMessage` dengan teks `Halo {{otp}}`), `runner.ts` akan mengganti string `{{otp}}` menjadi `1234` sebelum dikirim ke browser.

## 2. Peningkatan Dashboard (React / Vite)
- UI *styling* diatur secara terpusat di `frontend/src/index.css`.
- Jika ingin menambah komponen baru, letakkan di `frontend/src/components/`.
- UI menggunakan gaya *Glassmorphism* modern dengan efek `backdrop-filter: blur()`.

## 3. Menambah Action Baru di Playwright
1. Buka `automation/src/actions.ts`.
2. Tambahkan `case` baru di dalam blok `switch (action)`.
3. Tulis logika Playwright (misal `await page.click(...)`).
4. Update antarmuka UI di `frontend/src/pages/AddJourney.tsx` untuk menyediakan tombol/input parameter untuk *action* baru tersebut.

## 4. Troubleshooting Celery
Jika Celery tidak memproses tugas:
- Cek koneksi Redis (pastikan `redis-server` berjalan).
- Pastikan menjalankan celery worker dengan perintah: `celery -A backend.celery_app worker --loglevel=info` dari *root directory*.
- Jika ada perubahan pada kode backend atau automation, Anda **harus** me-restart proses Celery worker.
