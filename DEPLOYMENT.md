# Deployment Guide

Dokumen ini berisi panduan untuk melakukan *deployment* aplikasi WhatsApp Automation ini (Backend, Celery Worker, Frontend, dan Redis).

## Arsitektur Aplikasi

1.  **FastAPI Backend (Port 8000)**: Menangani API, manajemen *Journey*, dan penjadwalan.
2.  **Celery Worker**: Memproses tugas eksekusi *Playwright* secara *asynchronous* (di latar belakang).
3.  **Redis (Port 6379)**: Berfungsi sebagai *Message Broker* antara FastAPI dan Celery.
4.  **React Frontend (Port 5173 / Nginx)**: Antarmuka pengguna (Dashboard & Builder).

## Prasyarat (Prerequisites)

- Node.js (v18+)
- Python (3.10+)
- Redis Server
- Chromium/Chrome browser terinstal (untuk Playwright)

## Menjalankan secara Lokal (Development)

### 1. Menjalankan Redis
Pastikan Redis sudah berjalan di mesin Anda. Jika menggunakan Docker:
```bash
docker run -d -p 6379:6379 redis
```

### 2. Setup dan Jalankan Backend
Buka terminal dan jalankan FastAPI:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn api:router --host 0.0.0.0 --port 8000 --reload
```

### 3. Menjalankan Celery Worker
Buka terminal baru, masuk ke direktori *root* projek (`/home/dolphin/whatsapp/`):
```bash
source backend/venv/bin/activate
celery -A backend.celery_app worker --loglevel=info
```
> **Catatan:** Celery worker bertanggung jawab untuk menjalankan `runner.ts`.

### 4. Setup Playwright Automation
Buka terminal baru:
```bash
cd automation
npm install
npx playwright install
npm run build
```

### 5. Menjalankan Frontend
Buka terminal baru:
```bash
cd frontend
npm install
npm run dev
```

Akses `http://localhost:5173` di browser Anda.

## Produksi (Production Deployment)

Untuk *production*, disarankan menggunakan **Docker Compose** atau **Supervisor** untuk menjaga semua *service* (FastAPI, Celery, Redis, Frontend) tetap hidup.

*   Gunakan `pm2` atau `systemd` untuk menjalankan `uvicorn` dan `celery worker`.
*   Gunakan Nginx untuk menyajikan halaman statis dari `frontend/dist` setelah menjalankan `npm run build`.
