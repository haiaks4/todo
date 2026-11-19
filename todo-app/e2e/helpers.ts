import { expect, type Locator, type Page } from '@playwright/test';

/** テストごとに重ならないタスク名を作る */
export const uniqueTitle = (label: string) =>
    `${label} ${Date.now().toString(36)}`;

/** タスク一覧のカード */
export const taskCard = (page: Page, title: string) =>
    page.locator('[data-slot=task-item]', { hasText: title });

/** タスク管理画面を開き、一覧の読み込みを待つ */
export const openTasks = async (page: Page) => {
    await page.goto('/task');
    await expect(
        page.getByRole('textbox', { name: 'タスクを追加' }),
    ).toBeVisible();
};

/** 一覧の上の入力欄からタスクを追加する */
export const quickAdd = async (page: Page, text: string, title: string) => {
    await page.getByRole('textbox', { name: 'タスクを追加' }).fill(text);
    await page.keyboard.press('Enter');
    await expect(taskCard(page, title)).toBeVisible();
};

/** 東京時間で「今日から days 日後」を「11/20」の形式で返す */
export const tokyoMonthDay = (days: number) => {
    const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return date.toLocaleDateString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        month: '2-digit',
        day: '2-digit',
    });
};

/** タッチ操作（スワイプ・長押し）を再現する。Chromium の CDP を使う */
export const touch = async (page: Page) => {
    const cdp = await page.context().newCDPSession(page);
    const send = (type: string, x?: number, y?: number) =>
        cdp.send('Input.dispatchTouchEvent', {
            type: type as 'touchStart' | 'touchMove' | 'touchEnd',
            touchPoints: type === 'touchEnd' ? [] : [{ x: x ?? 0, y: y ?? 0 }],
        });
    const center = async (locator: Locator) => {
        await locator.scrollIntoViewIfNeeded();
        const box = await locator.boundingBox();
        if (!box) throw new Error('要素が表示されていません');
        return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };

    return {
        swipe: async (locator: Locator, dx: number) => {
            const { x, y } = await center(locator);
            await send('touchStart', x, y);
            for (let i = 1; i <= 10; i++) {
                await send('touchMove', x + (dx * i) / 10, y);
                await page.waitForTimeout(16);
            }
            await send('touchEnd');
        },
        longPress: async (locator: Locator) => {
            const { x, y } = await center(locator);
            await send('touchStart', x, y);
            await page.waitForTimeout(700);
            await send('touchEnd');
        },
    };
};
