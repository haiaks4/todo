// 使い方: node capture.cjs <base-url> <scenes-file> <out-dir> <label>
//   label は before / after。保存先は <out-dir>/<label>-<scene.name>.png
//
// scenes-file は次の形の配列を module.exports する CommonJS ファイル:
//   { name: 'task-list', title: 'タスク一覧', device: 'mobile' | 'desktop',
//     path: '/task', fullPage?: boolean,
//     run?: async ({ page, swipe, longPress }) => { ... } }   // 撮影前の操作
const path = require('node:path');
const { chromium, devices } = require('playwright');

const [baseUrl, scenesFile, outDir, label] = process.argv.slice(2);
if (!label) {
    console.error('usage: node capture.cjs <base-url> <scenes-file> <out-dir> <label>');
    process.exit(1);
}
const scenes = require(path.resolve(scenesFile));

const DEVICES = {
    mobile: devices['iPhone 13'],
    desktop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 },
};

(async () => {
    const browser = await chromium.launch(
        process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
    );
    for (const scene of scenes) {
        const context = await browser.newContext(DEVICES[scene.device ?? 'desktop']);
        const page = await context.newPage();
        // 変更前の画面に無い操作で長く待たないよう、待ち時間を短くする
        page.setDefaultTimeout(5000);

        // タッチ操作（スワイプ・長押し）は CDP で再現する
        const cdp = await context.newCDPSession(page);
        const touch = (type, x, y) =>
            cdp.send('Input.dispatchTouchEvent', {
                type,
                touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
            });
        const center = async (locator) => {
            await locator.scrollIntoViewIfNeeded();
            const b = await locator.boundingBox();
            return [b.x + b.width / 2, b.y + b.height / 2];
        };
        const swipe = async (locator, dx, dy = 0, { release = true } = {}) => {
            const [x, y] = await center(locator);
            await touch('touchStart', x, y);
            for (let i = 1; i <= 10; i++) {
                await touch('touchMove', x + (dx * i) / 10, y + (dy * i) / 10);
                await page.waitForTimeout(20);
            }
            if (release) await touch('touchEnd');
        };
        const longPress = async (locator, ms = 700) => {
            const [x, y] = await center(locator);
            await touch('touchStart', x, y);
            await page.waitForTimeout(ms);
            await touch('touchEnd');
        };

        await page.goto(`${baseUrl}/login`, { timeout: 30000 });
        await page.fill('#email', 'demo@example.com');
        await page.fill('#password', 'password');
        await page.click('button[type=submit]');
        await page.waitForURL('**/dashboard');

        await page.goto(`${baseUrl}${scene.path}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        try {
            if (scene.run) await scene.run({ page, swipe, longPress });
            await page.waitForTimeout(400);
            const file = path.join(outDir, `${label}-${scene.name}.png`);
            await page.screenshot({ path: file, fullPage: scene.fullPage ?? false });
            console.log('saved', file);
        } catch (e) {
            // 変更前の画面には新しい操作が無いことがあるので、失敗しても続ける
            console.warn(`skip ${label}-${scene.name}: ${e.message.split('\n')[0]}`);
        }
        await context.close();
    }
    await browser.close();
})();
