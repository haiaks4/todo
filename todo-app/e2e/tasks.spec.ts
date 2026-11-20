import { expect, test } from '@playwright/test';
import {
    openTasks,
    quickAdd,
    taskCard,
    tokyoMonthDay,
    uniqueTitle,
} from './helpers';

test.beforeEach(async ({ page }) => {
    await openTasks(page);
});

test('作成画面からタスクを作成すると一覧に出る', async ({ page }) => {
    const title = uniqueTitle('作成画面のタスク');

    await page.getByRole('button', { name: 'タスクを作成' }).click();
    await page.getByLabel('タイトル').fill(title);
    await page.getByLabel('説明').fill('E2E テストで作成');
    await page.getByRole('button', { name: '保存' }).click();

    await expect(page.getByText('タスクを作成しました。')).toBeVisible();
    await expect(taskCard(page, title)).toBeVisible();
});

test('完了にすると「完了済み」に移り、「元に戻す」で戻る', async ({ page }) => {
    const title = uniqueTitle('完了するタスク');
    await quickAdd(page, title, title);

    await page
        .getByRole('button', { name: `「${title}」を完了にする` })
        .click();

    // 完了済みは折りたたまれているので、一覧からは見えなくなる
    await expect(taskCard(page, title)).toBeHidden();
    await expect(page.getByRole('button', { name: /^完了済み/ })).toBeVisible();

    await page.getByRole('button', { name: '元に戻す' }).click();
    await expect(
        page.getByRole('button', { name: `「${title}」を完了にする` }),
    ).toBeVisible();
});

test('削除しても「元に戻す」で戻せる', async ({ page }) => {
    const title = uniqueTitle('削除するタスク');
    await quickAdd(page, title, title);

    await taskCard(page, title).getByRole('button', { name: '操作' }).click();
    await page.getByRole('menuitem', { name: '削除' }).click();

    await expect(taskCard(page, title)).toBeHidden();
    await page.getByRole('button', { name: '元に戻す' }).click();
    await expect(taskCard(page, title)).toBeVisible();

    // 再読み込みしても残っている（サーバー側でも元に戻っている）
    await page.reload();
    await expect(taskCard(page, title)).toBeVisible();
});

test('すばやく追加で期限・タグ・優先度を一緒に設定できる', async ({ page }) => {
    const title = uniqueTitle('すばやく追加');

    await quickAdd(page, `${title} 明日15時 #仕事 !高`, title);

    const card = taskCard(page, title);
    await expect(card.getByText('優先度 高')).toBeVisible();
    await expect(card.getByText('仕事', { exact: true })).toBeVisible();
    await expect(card.getByText(`${tokyoMonthDay(1)} 15:00`)).toBeVisible();
});
