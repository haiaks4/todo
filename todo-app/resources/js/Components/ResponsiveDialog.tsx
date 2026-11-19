import { createContext, useContext } from 'react';
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

type RootProps = React.ComponentProps<typeof Dialog>;

export function ResponsiveDialog(props: RootProps) {
    const desktop = useIsDesktop();
    return (
        <DesktopContext.Provider value={desktop}>
            {desktop ? <Dialog {...props} /> : <Sheet {...props} />}
        </DesktopContext.Provider>
    );
}

export function ResponsiveDialogContent({
    className,
    ...props
}: React.ComponentProps<typeof DialogContent>) {
    return useContext(DesktopContext) ? (
        <DialogContent className={className} {...props} />
    ) : (
        <SheetContent
            side="bottom"
            className={cn(
                'max-h-[90dvh] gap-4 overflow-y-auto rounded-t-2xl px-4 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))]',
                className,
            )}
            {...props}
        />
    );
}

export function ResponsiveDialogHeader({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return useContext(DesktopContext) ? (
        <DialogHeader className={className} {...props} />
    ) : (
        <SheetHeader className={cn('p-0 pr-8', className)} {...props} />
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
