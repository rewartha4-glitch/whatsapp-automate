import { chromium, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const SESSION_DIR = path.resolve(__dirname, '../../storage/browser-session');
const VIDEOS_DIR = path.resolve(__dirname, '../../videos');
const TRACE_DIR = path.resolve(__dirname, '../../trace');

export interface BrowserSession {
    context: BrowserContext;
    page: Page;
}

export async function setupBrowser(executionId: string, headless: boolean = true): Promise<BrowserSession> {
    if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    const context = await chromium.launchPersistentContext(SESSION_DIR, {
        headless,
        recordVideo: {
            dir: path.join(VIDEOS_DIR, executionId),
        },
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
    });

    await context.tracing.start({ screenshots: true, snapshots: true });

    let page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
    
    // Go to WhatsApp Web
    await page.goto('https://web.whatsapp.com');

    // Wait until either QR code is visible or chat list is visible
    // This allows it to work whether logged in or not
    try {
        await page.waitForSelector('div[data-ref], div[aria-label="Chat list"]', { timeout: 60000 });
    } catch (e) {
        console.warn("Could not find QR code or chat list. Continuing anyway...");
    }

    return { context, page };
}

export async function teardownBrowser(session: BrowserSession, executionId: string) {
    const tracePath = path.join(TRACE_DIR, `${executionId}.zip`);
    if (!fs.existsSync(TRACE_DIR)) fs.mkdirSync(TRACE_DIR, { recursive: true });
    
    await session.context.tracing.stop({ path: tracePath });
    await session.context.close();
    
    return { tracePath };
}
