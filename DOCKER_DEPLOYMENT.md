# End-to-End Deployment Guide (Git & Docker)

Panduan ini berisi langkah-langkah **dari awal sampai akhir** untuk memindahkan _source code_ dari komputer lokal Anda, mengunggahnya ke repositori Git (seperti GitHub/GitLab), dan menjalankannya di server Ubuntu menggunakan Docker Compose.

---

## FASE 1: Di Komputer Lokal (Laptop/PC Anda)

Fase ini bertujuan untuk menyimpan _source code_ Anda ke dalam Git dan mengunggahnya ke GitHub/GitLab. Saya juga telah membuatkan file `.gitignore` agar file-file sampah, *log*, dan kredensial (`.env`) tidak ikut terunggah secara tidak sengaja.

### 1. Buat Repositori Kosong di GitHub/GitLab
Buka GitHub atau GitLab, buat _repository_ baru (misalnya bernama `whatsapp-automation`). **Jangan** centang opsi "Initialize this repository with a README". Copy URL dari repositori tersebut (contoh: `https://github.com/username/whatsapp-automation.git`).

### 2. Inisialisasi Git dan Push Kode
Buka terminal di komputer lokal Anda (di dalam folder proyek `whatsapp` ini) dan jalankan perintah berikut secara berurutan:

```bash
# 1. Inisialisasi folder ini menjadi Git repository
git init

# 2. Tambahkan semua file (file sampah dan .env sudah otomatis diabaikan oleh .gitignore)
git add .

# 3. Buat commit pertama
git commit -m "Initial commit for deployment"

# 4. Hubungkan dengan repositori di GitHub/GitLab (Ganti URL di bawah dengan URL repo Anda)
git remote add origin https://github.com/username/whatsapp-automation.git

# 5. Ubah branch utama menjadi 'main'
git branch -M main

# 6. Unggah (push) kode ke GitHub/GitLab
git push -u origin main
```
Sekarang, semua _source code_ Anda sudah aman tersimpan di repositori online.

---

## FASE 2: Di Server (Ubuntu)

Fase ini dilakukan di dalam server (VPS/Cloud) tempat aplikasi akan di-_hosting_. Buka terminal dan lakukan koneksi SSH ke server Anda.

### 1. Instalasi Docker & Docker Compose
Jika server Anda baru dan belum ada Docker, jalankan script instalasi resmi ini:

```bash
# Update sistem
sudo apt-get update

# Install curl
sudo apt-get install -y curl

# Download dan jalankan script instalasi Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Tambahkan user Anda ke dalam grup docker agar bisa jalan tanpa 'sudo'
sudo usermod -aG docker $USER

# PERHATIAN: Setelah menjalankan perintah di atas, Anda harus LOGOUT (exit) dari SSH 
# lalu LOGIN KEMBALI agar perubahan grup berlaku.
```

### 2. Clone Repository dari GitHub/GitLab
Setelah login kembali ke server, unduh _source code_ dari repositori Anda.

```bash
# Masuk ke direktori web (opsional, bisa di folder home)
mkdir -p /var/www
cd /var/www

# Clone kode dari GitHub
git clone https://github.com/username/whatsapp-automation.git
cd whatsapp-automation
```

### 3. Setup Konfigurasi (.env)
File `.env` tidak ikut ter-_upload_ ke GitHub demi keamanan. Anda harus membuatnya secara manual di server.

```bash
# Buat file .env dari contoh yang ada
cp .env.example .env

# Edit file .env jika diperlukan (masukkan kredensial API, db, dll)
nano .env
```

---

## FASE 3: Menjalankan Aplikasi (Deployment)

Masih di dalam terminal server dan berada di folder proyek, jalankan perintah berikut untuk mem-_build_ dan menyalakan semua sistem:

```bash
docker compose up -d --build
```

**Proses ini akan memakan waktu cukup lama** (bisa 5-15 menit tergantung kecepatan internet server) karena Docker harus mengunduh Ubuntu, Python, Node.js, Playwright Browser, dan menginstal semua *dependencies*.

### Verifikasi Deployment

1. **Cek Status Kontainer**:
   ```bash
   docker compose ps
   ```
   Pastikan keempat _service_ (`whatsapp_frontend`, `whatsapp_backend`, `whatsapp_worker`, `whatsapp_redis`) berstatus **Up**.

2. **Akses Aplikasi**:
   Buka browser dan ketikkan alamat IP server Anda beserta _port_ frontend:
   `http://<IP_SERVER>:5173`
   *(Pastikan port 5173 terbuka/diizinkan di Firewall server Anda).*

3. **Cek Log (Jika ada error)**:
   ```bash
   # Log untuk semua kontainer
   docker compose logs -f
   
   # Log khusus untuk pekerja latar belakang (Playwright/Celery)
   docker compose logs -f worker
   ```

---

## FASE 4: Flow Jika Ada Update (Pembaruan Kode)

Di kemudian hari, jika Anda mengubah kode aplikasi (misalnya mengedit React atau FastAPI) di laptop Anda, flow-nya sangat mudah dan elegan:

**1. Di Komputer Lokal (Laptop):**
```bash
git add .
git commit -m "Update fitur XYZ"
git push
```

**2. Di Server:**
```bash
cd /var/www/whatsapp-automation
git pull
docker compose up -d --build
```
Hanya dengan perintah di atas, Docker akan otomatis mendeteksi perubahan, mem-_build_ ulang bagian yang berubah saja, dan me-_restart_ kontainer tanpa harus mematikan seluruh aplikasi.
