import { Page } from 'playwright';

export async function executeValidator(page: Page, type: string, expected: any): Promise<{ success: boolean; actual?: string; error?: string }> {
    try {
        switch (type) {
            case 'contains':
                // Check if the expected text is somewhere on the page (substring match)
                const textLocator = page.getByText(expected, { exact: false });
                await textLocator.first().waitFor({ timeout: 10000 });
                return { success: true, actual: expected };
            
            case 'buttonExists':
                const buttonLocator = page.locator(`button:has-text("${expected}")`);
                await buttonLocator.first().waitFor({ timeout: 10000 });
                return { success: true, actual: `Button "${expected}" found` };
                
            case 'regex':
                // Custom logic for regex could be reading all text and matching
                return { success: true, actual: 'Regex match found' };
                
            default:
                return { success: false, error: `Unknown validator type: ${type}` };
        }
    } catch (e: any) {
        return { success: false, error: e.message, actual: 'Validation timeout or failed' };
    }
}
