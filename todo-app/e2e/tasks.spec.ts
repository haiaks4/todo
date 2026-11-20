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

test('ごみ箱から元に戻したり、完全に削除したりできる', async ({ page }) => {
    const restoreTitle = uniqueTitle('ごみ箱から戻す');
    const purgeTitle = uniqueTitle('完全に削除する');
    await quickAdd(page, restoreTitle, restoreTitle);
    await quickAdd(page, purgeTitle, purgeTitle);

    for (const title of [restoreTitle, purgeTitle]) {
        await taskCard(page, title)
            .getByRole('button', { name: '操作' })
            .click();
        await page.getByRole('menuitem', { name: '削除' }).click();
        await expect(taskCard(page, title)).toBeHidden();
    }

    await page.getByRole('link', { name: 'ごみ箱' }).click();
    await expect(page).toHaveURL(/\/task\/trash$/);
    const trash = page.getByRole('list', { name: 'ごみ箱のタスク' });

    await page
        .getByRole('button', { name: `「${restoreTitle}」を元に戻す` })
        .click();
    await expect(trash.getByText(restoreTitle)).toBeHidden();

    await page
        .getByRole('button', { name: `「${purgeTitle}」を完全に削除` })
        .click();
    await page.getByRole('button', { name: '完全に削除する' }).click();
    await expect(trash.getByText(purgeTitle)).toBeHidden();

    await page.getByRole('link', { name: 'タスク管理に戻る' }).click();
    await expect(taskCard(page, restoreTitle)).toBeVisible();
    await expect(taskCard(page, purgeTitle)).toBeHidden();
});

test('プロジェクトを作って切り替え、プロジェクトごとにタスクを分けられる', async ({
    page,
}) => {
    const projectName = uniqueTitle('プロジェクト');
    const inProject = uniqueTitle('プロジェクトのタスク');
    const inInbox = uniqueTitle('インボックスのタスク');

    // プロジェクトを作る
    await page.getByRole('button', { name: /^プロジェクトを切り替え/ }).click();
    await page.getByRole('menuitem', { name: 'プロジェクトの管理' }).click();
    await page.getByLabel('新しいプロジェクト名').fill(projectName);
    await page.getByRole('button', { name: '追加' }).click();
    await page.getByRole('button', { name: '閉じる' }).first().click();

    // インボックスに 1 件、プロジェクトに 1 件追加する
    await page.getByRole('button', { name: /^プロジェクトを切り替え/ }).click();
    await page.getByRole('menuitemradio', { name: 'インボックス' }).click();
    await quickAdd(page, inInbox, inInbox);

    await page.getByRole('button', { name: /^プロジェクトを切り替え/ }).click();
    await page.getByRole('menuitemradio', { name: projectName }).click();
    await quickAdd(page, inProject, inProject);
    await expect(taskCard(page, inInbox)).toBeHidden();

    // すべてのタスクでは両方が見え、プロジェクト名が付く
    await page.getByRole('button', { name: /^プロジェクトを切り替え/ }).click();
    await page.getByRole('menuitemradio', { name: 'すべてのタスク' }).click();
    await expect(taskCard(page, inInbox)).toBeVisible();
    await expect(
        taskCard(page, inProject).getByText(projectName),
    ).toBeVisible();
});
