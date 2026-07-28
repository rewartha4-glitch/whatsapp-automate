const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const context = await chromium.launchPersistentContext(path.resolve(__dirname, '../storage/browser-session'), { 
        headless: true,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const page = await context.newPage();
    await page.goto('https://web.whatsapp.com/send?phone=62216505555');
    await page.waitForSelector('footer div[contenteditable="true"]', { timeout: 30000 });
    
    const msgs = await page.evaluate(() => {
        const rows = document.querySelectorAll('div[role="row"]');
        if (rows.length === 0) return [];
        return [rows[rows.length - 1].outerHTML];
    });
    
    console.log(JSON.stringify(msgs, null, 2));
    await context.close();
})();
