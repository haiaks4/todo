import { useEffect, useState } from 'react';

/**
 * ブラウザに保存される state（表示の設定など、端末ごとに覚えておけば十分なもの）。
 * プライベートブラウズなどで保存できない場合は、ふつうの state として動く。
 */
export function usePersistentState<T>(
    key: string,
    initial: T,
    isValid: (value: unknown) => value is T = (v): v is T =>
        typeof v === typeof initial,
) {
    const [value, setValue] = useState<T>(() => {
        try {
            const stored = window.localStorage.getItem(key);
            if (stored !== null) {
                const parsed: unknown = JSON.parse(stored);
                if (isValid(parsed)) return parsed;
            }
        } catch {
            // 読み込めないときは初期値を使う
        }
        return initial;
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // 保存できなくても動作は続ける
        }
    }, [key, value]);

    return [value, setValue] as const;
}
