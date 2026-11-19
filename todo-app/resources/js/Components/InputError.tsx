import { cn } from '@/lib/utils';

/** フォーム項目の下に表示するエラーメッセージ */
export default function InputError({
    message,
    className,
}: {
    message?: string;
    className?: string;
}) {
    if (!message) return null;

    return (
        <p role="alert" className={cn('text-sm text-destructive', className)}>
            {message}
        </p>
    );
}
