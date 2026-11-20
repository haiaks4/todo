import type { KeyboardEvent } from 'react';

/**
 * 日本語入力の変換を確定するための Enter かどうか。
 * 変換中は isComposing、Safari の確定時は keyCode が 229 になる。
 */
export const isImeEnter = (e: KeyboardEvent) =>
    e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229);
