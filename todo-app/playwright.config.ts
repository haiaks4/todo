import { defineConfig, devices } from '@playwright/test';

// E2E テストの設定（npm run test:e2e で実行）
// 事前に npm run build でフロントエンドをビルドしておく（test:e2e に含まれる）
const port = Number(process.env.E2E_PORT ?? 8123);
const baseURL = `http://127.0.0.1:${port}`;

// 別の場所にある Chromium を使う場合（Playwright の版と合わない環境など）
const launchOptions = process.env.PW_CHROMIUM_PATH
    ? { executablePath: process.env.PW_CHROMIUM_PATH }
    : {};

export default defineConfig({
    testDir: './e2e',
    // テストどうしで同じユーザーのデータを使うので、1 つずつ順に実行する
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI
        ? [['github'], ['list'], ['html', { open: 'never' }]]
        : 'list',
    use: {
        baseURL,
        locale: 'ja-JP',
        // 期限の判定をサーバー（APP_TIMEZONE）と合わせる
        timezoneId: 'Asia/Tokyo',
        trace: 'retain-on-failure',
        launchOptions,
    },
    projects: [
        { name: 'setup', testMatch: /auth\.setup\.ts/ },
        {
            name: 'desktop',
            testMatch: /(tasks|desktop)\.spec\.ts/,
            dependencies: ['setup'],
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 800 },
                storageState: 'e2e/.auth/user.json',
            },
        },
        {
            name: 'mobile',
            testMatch: /mobile\.spec\.ts/,
            dependencies: ['setup'],
            use: {
                ...devices['Pixel 7'],
                storageState: 'e2e/.auth/user.json',
            },
        },
    ],
    webServer: {
        command: 'bash e2e/serve.sh',
        url: `${baseURL}/login`,
        reuseExistingServer: false,
        timeout: 60_000,
        env: { E2E_PORT: String(port) },
    },
});
