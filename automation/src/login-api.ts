import { setupBrowser } from './browser';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const STATUS_FILE = path.resolve(__dirname, '../login_status.json');

function updateStatus(status: string, qrData?: string, error?: string) {
    fs.writeFileSync(STATUS_FILE, JSON.stringify({
        status,
        qr: qrData || null,
        error: error || null,
        updatedAt: new Date().toISOString()
    }));
}

async function login() {
    updateStatus('STARTING');
    
    const session = await setupBrowser('manual-login', true);
    const { page } = session;
    
    updateStatus('WAITING_FOR_QR');
    
    let lastQr = '';
    let loggedIn = false;
    
    for (let i = 0; i < 180; i++) { // 3 minutes timeout
        try {
            const chatList = await page.locator('div[aria-label="Chat list"]').count();
            if (chatList > 0) {
                updateStatus('LOGGED_IN');
                loggedIn = true;
                break;
            }
            
            const qrData = await page.getAttribute('div[data-ref]', 'data-ref', { timeout: 1000 }).catch(() => null);
            if (qrData && qrData !== lastQr) {
                lastQr = qrData;
                updateStatus('QR_READY', qrData);
            }
        } catch (e) {
            // Ignore
        }
        
        await page.waitForTimeout(1000);
    }
    
    if (!loggedIn) {
        updateStatus('TIMEOUT', undefined, 'Timeout waiting for QR code or login');
    }
    
    await session.context.close();
}

login().catch(e => {
    updateStatus('ERROR', undefined, String(e.stack || e));
    process.exit(1);
});
