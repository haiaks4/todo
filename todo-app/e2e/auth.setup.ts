import { expect, test as setup } from '@playwright/test';

// ログインして、その状態を各テストで使い回す
setup('ログインする', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill('e2e@example.com');
    await page.getByLabel('パスワード').fill('password');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
