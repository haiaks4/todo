// テストの共通設定
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 各テストのあとに描画した画面を片付ける
afterEach(() => {
    cleanup();
});

// jsdom に無いブラウザの機能を補う（Radix UI などが使う）
window.matchMedia ??= (query: string) =>
    ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
    }) as MediaQueryList;
