import { setupBrowser } from './browser';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import * as qrcode from 'qrcode-terminal';

async function login() {
    console.log("Starting browser in headless mode for manual login...");
    const session = await setupBrowser('manual-login', true);
    const { page } = session;
    
    console.log("Menunggu WhatsApp Web dimuat...");
    
    let lastQr = '';
    let loggedIn = false;
    
    // Loop selama 120 detik (120 * 1 detik)
    for (let i = 0; i < 120; i++) {
        try {
            // Cek apakah sudah login (muncul daftar chat)
            const chatList = await page.locator('div[aria-label="Chat list"]').count();
            if (chatList > 0) {
                console.log("\n✅ BERHASIL! Daftar chat sudah dimuat. Sesi tersimpan permanen.");
                loggedIn = true;
                break;
            }
            
            // Cek QR Code
            const qrData = await page.getAttribute('div[data-ref]', 'data-ref', { timeout: 1000 }).catch(() => null);
            if (qrData && qrData !== lastQr) {
                lastQr = qrData;
                console.clear();
                console.log("Scan QR Code ini menggunakan WhatsApp Anda (QR akan otomatis refresh):");
                qrcode.generate(qrData, { small: true });
            }
        } catch (e) {
            // Abaikan error saat polling
        }
        
        await page.waitForTimeout(1000);
    }
    
    if (!loggedIn) {
        console.log("❌ Waktu habis! Gagal mendeteksi login. Silakan ulangi perintah `node dist/login.js`.");
    }
    
    console.log("Closing browser...");
    await session.context.close();
    console.log("Done.");
}

login().catch(e => {
    console.error(e);
    process.exit(1);
});
