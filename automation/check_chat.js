const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const context = await chromium.launchPersistentContext(path.resolve(__dirname, '../storage/browser-session'), { 
        headless: true,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
    
    await page.goto('https://web.whatsapp.com/send?phone=62216505555');
    console.log('Waiting for chat to load...');
    await page.waitForSelector('footer div[contenteditable="true"]', { timeout: 30000 });
    
    const msgs = await page.evaluate(() => {
        const elements = document.querySelectorAll('div[data-testid^="conv-msg-"]');
        return Array.from(elements).slice(-20).map(el => {
            const hasStatusIcon = el.querySelector('[data-icon="msg-time"], [data-icon="msg-check"], [data-icon="msg-dblcheck"]') !== null;
            return {
                direction: hasStatusIcon ? 'OUTGOING' : 'INCOMING',
                text: el.innerText.substring(0, 100).replace(/\n/g, ' ')
            };
        });
    });
    
    console.log(JSON.stringify(msgs, null, 2));
    await context.close();
})();
