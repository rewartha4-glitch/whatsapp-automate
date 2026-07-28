import { Page } from 'playwright';
import * as path from 'path';

export async function executeAction(page: Page, action: string, data: any, filePrefix: string, stepIndex: number, variables: Record<string, string> = {}): Promise<{ success: boolean; error?: string; screenshotPath?: string }> {
    try {
        switch (action) {
            case 'wait':
                await page.waitForTimeout(data.durationMs || 1000);
                break;
            case 'waitForResponse':
                // Wait for a NEW incoming message that contains the expected text
                const foundText = await page.waitForFunction((expectedText: any) => {
                    const oldId = (window as any).lastMsgIdBeforeSend;
                    const msgs = Array.from(document.querySelectorAll('div[data-testid^="conv-msg-"]'));
                    if (msgs.length === 0) return false;
                    
                    let oldIndex = -1;
                    if (oldId) {
                        oldIndex = msgs.findIndex(m => m.getAttribute('data-id') === oldId);
                    }
                    
                    const startIndex = oldIndex !== -1 ? oldIndex + 1 : 0;
                    
                    for (let i = startIndex; i < msgs.length; i++) {
                        const msg = msgs[i] as HTMLElement;
                        const hasStatusIcon = msg.querySelector('[data-icon="msg-time"], [data-icon="msg-check"], [data-icon="msg-dblcheck"]') !== null;
                        if (!hasStatusIcon) {
                            if (Array.isArray(expectedText)) {
                                if (expectedText.some(text => msg.innerText.includes(text))) return msg.innerText;
                            } else {
                                if (msg.innerText.includes(expectedText)) return msg.innerText;
                            }
                        }
                    }
                    return false;
                }, data.expected, { timeout: 45000 });
                
                if (data.extractVar && data.extractRegex) {
                    const msgText = await foundText.jsonValue() as string;
                    if (typeof msgText === 'string') {
                        const match = new RegExp(data.extractRegex).exec(msgText);
                        if (match && match[1]) {
                            variables[data.extractVar] = match[1];
                        }
                    }
                }
                
                // Add a small 1s Node-side delay to allow UI to settle before the next action
                await page.waitForTimeout(1000);
                break;
            case 'type':
                await page.fill(data.selector, data.text);
                break;
            case 'clickButton':
                // Attempt to click by exact text or button role
                await page.locator(`button:has-text("${data.text}")`).click();
                break;
            case 'clickList':
                await page.locator(`text="${data.text}"`).click();
                break;
            case 'sendMessage':
                // Record the ID of the last message before we send ours
                await page.evaluate(() => {
                    const msgs = document.querySelectorAll('div[data-testid^="conv-msg-"]');
                    (window as any).lastMsgIdBeforeSend = msgs.length > 0 ? msgs[msgs.length - 1].getAttribute('data-id') : null;
                });
                // WhatsApp Web input box
                const inputLocator = page.locator('footer div[contenteditable="true"]');
                await inputLocator.click();
                await page.waitForTimeout(500);
                await inputLocator.fill(data.text);
                await page.waitForTimeout(500);
                await page.keyboard.press('Enter');
                break;
            case 'takeScreenshot':
                const screenshotPath = path.resolve(__dirname, `../../screenshots/${filePrefix}-step-${stepIndex}.png`);
                await page.screenshot({ path: screenshotPath });
                return { success: true, screenshotPath };
            case 'finish':
                break;
            default:
                if (action !== 'validate') {
                    console.warn(`Unknown action: ${action}`);
                }
                break;
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
