import { ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppLogo({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 font-semibold',
                className,
            )}
        >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ListTodo className="size-5" />
            </span>
            TODO アプリ
        </span>
    );
}
