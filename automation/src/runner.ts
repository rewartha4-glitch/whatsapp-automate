import * as fs from 'fs';
import * as path from 'path';
import { setupBrowser, teardownBrowser } from './browser';
import { executeAction } from './actions';
import { executeValidator } from './validators';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const headless = process.env.HEADLESS !== 'false';

async function run() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("Usage: node runner.js <journey_json_path> <execution_id>");
        process.exit(1);
    }

    const journeyPath = args[0];
    const executionId = args[1];

    if (!fs.existsSync(journeyPath)) {
        console.error(`Journey file not found: ${journeyPath}`);
        process.exit(1);
    }

    const journeyData = JSON.parse(fs.readFileSync(journeyPath, 'utf8'));
    const steps = journeyData.steps || [];
    
    // Flow01_nama_tanggal_jam_waktu
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 19).replace(/T/g, '_').replace(/:/g, '_').replace(/-/g, '_');
    const filePrefix = `${journeyData.journeyId}_${localISOTime}`;
    
    const startTime = Date.now();
    const session = await setupBrowser(executionId, headless);
    const { page } = session;

    let overallStatus = 'PASS';
    let errorMessage = '';
    const executionResults: any[] = [];
    const variables: Record<string, string> = {};

    function substituteVariables(obj: any): any {
        if (typeof obj === 'string') {
            return obj.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, p1) => {
                return variables[p1] || match;
            });
        }
        if (Array.isArray(obj)) {
            return obj.map(substituteVariables);
        }
        if (obj !== null && typeof obj === 'object') {
            const newObj: any = {};
            for (const key in obj) {
                newObj[key] = substituteVariables(obj[key]);
            }
            return newObj;
        }
        return obj;
    }

    try {
        // Go to specific chat if phone is provided
        if (journeyData.phone) {
            await page.goto(`https://web.whatsapp.com/send?phone=${journeyData.phone}`);
            // Wait for chat to load
            await page.waitForSelector('footer div[contenteditable="true"]', { timeout: 30000 });
        }

        for (let i = 0; i < steps.length; i++) {
            let step = substituteVariables(steps[i]);
            const stepStartTime = Date.now();
            let stepResult: any = { status: 'PASS' };

            if (step.action === 'validate') {
                const valResult = await executeValidator(page, step.type, step.expected);
                if (!valResult.success) {
                    stepResult.status = 'FAIL';
                    stepResult.error = valResult.error;
                    stepResult.actual = valResult.actual;
                } else {
                    stepResult.actual = valResult.actual;
                }
            } else {
                const actResult = await executeAction(page, step.action, step.data || step, filePrefix, i + 1, variables);
                if (!actResult.success) {
                    stepResult.status = 'FAIL';
                    stepResult.error = actResult.error;
                }
                if (actResult.screenshotPath) {
                    stepResult.screenshotPath = actResult.screenshotPath;
                }
            }

            stepResult.durationMs = Date.now() - stepStartTime;
            stepResult.action = step.action;
            stepResult.expected = step.expected || (step.data ? JSON.stringify(step.data) : null);
            executionResults.push(stepResult);

            if (stepResult.status === 'FAIL') {
                overallStatus = 'FAIL';
                errorMessage = stepResult.error;
                
                // Take failure screenshot
                const screenshotPath = path.resolve(__dirname, `../../screenshots/${filePrefix}-failure.png`);
                if (!fs.existsSync(path.dirname(screenshotPath))) fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
                await page.screenshot({ path: screenshotPath });
                stepResult.screenshotPath = screenshotPath;
                break; // Stop journey on failure
            }
        }
    } catch (e: any) {
        overallStatus = 'FAIL';
        errorMessage = e.message;
        try {
            const screenshotPath = path.resolve(__dirname, `../../screenshots/${filePrefix}-failure.png`);
            if (!fs.existsSync(path.dirname(screenshotPath))) fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
            await page.screenshot({ path: screenshotPath });
        } catch (err) {}
    } finally {
        const { tracePath } = await teardownBrowser(session, executionId);
        const durationMs = Date.now() - startTime;
        
        console.log(JSON.stringify({
            status: overallStatus,
            durationMs,
            error: errorMessage,
            tracePath,
            videoPath: path.resolve(__dirname, `../../videos/${executionId}`),
            steps: executionResults
        }));
    }
}

run().catch(e => {
    console.log(JSON.stringify({
        status: 'FAIL',
        error: e.message
    }));
    process.exit(1);
});
