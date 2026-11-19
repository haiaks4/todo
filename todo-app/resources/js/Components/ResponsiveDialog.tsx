import { createContext, useContext, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/Components/ui/sheet';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

/**
 * PC では中央のダイアログ、スマホでは画面下から出るシートとして表示する。
 * 片手で操作しやすいよう、スマホではボタンを画面の下側に置く。
 */
const DesktopContext = createContext(true);

/** シートを下にスワイプして閉じるために、開閉の状態を中身へ渡す */
const OpenStateContext = createContext<{
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}>({});

type RootProps = React.ComponentProps<typeof Dialog>;

export function ResponsiveDialog(props: RootProps) {
    const desktop = useIsDesktop();
    return (
        <DesktopContext.Provider value={desktop}>
            <OpenStateContext.Provider
                value={{ open: props.open, onOpenChange: props.onOpenChange }}
            >
                {desktop ? <Dialog {...props} /> : <Sheet {...props} />}
            </OpenStateContext.Provider>
        </DesktopContext.Provider>
    );
}

/** 下スワイプで閉じたとみなす距離（px）と速さ（px/ms） */
const CLOSE_DISTANCE = 120;
const CLOSE_VELOCITY = 0.5;

/** スマホ用のシート。上部のつまみと見出しを下にスワイプすると閉じる */
function SwipeableSheetContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SheetContent>) {
    const { open, onOpenChange } = useContext(OpenStateContext);
    const openRef = useRef(open);
    openRef.current = open;

    const [offset, setOffset] = useState(0);
    const [dragging, setDragging] = useState(false);
    const drag = useRef<{ y: number; time: number } | null>(null);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        // つまみと見出しの部分だけで受け付ける（フォームのスクロールや入力と競合させない）
        if (!target.closest('[data-sheet-drag-area]')) return;
        if (target.closest('button, a, input, textarea, select')) return;
        drag.current = { y: e.clientY, time: e.timeStamp };
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!drag.current) return;
        // 上方向には動かさない
        setOffset(Math.max(0, e.clientY - drag.current.y));
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        const start = drag.current;
        drag.current = null;
        setDragging(false);
        if (!start) return;

        const distance = e.clientY - start.y;
        const velocity = distance / Math.max(1, e.timeStamp - start.time);
        if (
            distance > CLOSE_DISTANCE ||
            (distance > 30 && velocity > CLOSE_VELOCITY)
        ) {
            onOpenChange?.(false);
            // 閉じなかった場合（未保存の変更の確認など）は元の位置に戻す
            window.setTimeout(() => {
                if (openRef.current) setOffset(0);
            }, 50);
        } else {
            setOffset(0);
        }
    };

    return (
        <SheetContent
            side="bottom"
            className={cn(
                'max-h-[90dvh] gap-4 overflow-y-auto rounded-t-2xl px-4 pt-0 pb-[max(1rem,env(safe-area-inset-bottom))]',
                className,
            )}
            // transform はアニメーションで使われるため、ずらす量は translate で指定する
            style={{
                translate: offset ? `0 ${offset}px` : undefined,
                transition: dragging ? 'none' : 'translate 200ms ease-out',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
                drag.current = null;
                setDragging(false);
                setOffset(0);
            }}
            {...props}
        >
            <div
                data-sheet-drag-area
                aria-hidden
                className="sticky top-0 z-10 -mx-4 flex touch-none justify-center bg-popover pt-2.5 pb-1"
            >
                <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            {children}
        </SheetContent>
    );
}

export function ResponsiveDialogContent({
    className,
    ...props
}: React.ComponentProps<typeof DialogContent>) {
    return useContext(DesktopContext) ? (
        <DialogContent className={className} {...props} />
    ) : (
        <SwipeableSheetContent className={className} {...props} />
    );
}

export function ResponsiveDialogHeader({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return useContext(DesktopContext) ? (
        <DialogHeader className={className} {...props} />
    ) : (
        <SheetHeader
            data-sheet-drag-area
            className={cn('-mt-2 touch-none p-0 pr-8', className)}
            {...props}
        />
    );
}

export function ResponsiveDialogTitle(
    props: React.ComponentProps<typeof DialogTitle>,
) {
    return useContext(DesktopContext) ? (
        <DialogTitle {...props} />
    ) : (
        <SheetTitle {...props} />
    );
}

export function ResponsiveDialogDescription(
    props: React.ComponentProps<typeof DialogDescription>,
) {
    return useContext(DesktopContext) ? (
        <DialogDescription {...props} />
    ) : (
        <SheetDescription {...props} />
    );
}

export function ResponsiveDialogFooter({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return useContext(DesktopContext) ? (
        <DialogFooter className={className} {...props} />
    ) : (
        <div
            className={cn('flex flex-col-reverse gap-2 pt-2', className)}
            {...props}
        />
    );
}
