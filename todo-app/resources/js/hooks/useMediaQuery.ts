import { useSyncExternalStore } from 'react';

/** CSS のメディアクエリに一致するかどうかを返す（画面サイズの変化にも追従する） */
export function useMediaQuery(query: string): boolean {
    return useSyncExternalStore(
        (onChange) => {
            const mql = window.matchMedia(query);
            mql.addEventListener('change', onChange);
            return () => mql.removeEventListener('change', onChange);
        },
        () => window.matchMedia(query).matches,
        () => false,
    );
}

/** Tailwind の `sm` ブレークポイント（640px）以上かどうか */
export const useIsDesktop = () => useMediaQuery('(min-width: 640px)');
