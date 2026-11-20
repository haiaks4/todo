import {
    CalendarClock,
    CornerDownLeft,
    Plus,
    Tag as TagIcon,
} from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { api, getErrorMessage, getValidationErrors } from '@/lib/api';
import { isImeEnter } from '@/lib/keyboard';
import { parseQuickAdd } from '@/lib/quickAdd';
import {
    formatDateTime,
    PRIORITY_BADGE_CLASSES,
    PRIORITY_LABELS,
} from '@/lib/task';
import type { Tag } from '@/types';

interface Props {
    tags: Tag[];
    /** タスクを追加したとき（新しいタグを作ったときは tagCreated が true） */
    onAdded: (tagCreated: boolean) => void;
}

/** 一覧の上の入力欄から、タイトル・期限・タグ・優先度をまとめて入力して追加する */
export default function QuickAddInput({ tags, onAdded }: Props) {
    const [value, setValue] = useState('');
    const [focused, setFocused] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hintId = useId();

    const parsed = value.trim() ? parseQuickAdd(value) : null;
    const existingTag = parsed?.tagName
        ? tags.find(
              (t) => t.name.toLowerCase() === parsed.tagName?.toLowerCase(),
          )
        : undefined;

    const submit = async () => {
        if (!parsed || submitting) return;
        if (!parsed.title) {
            setError('タイトルを入力してください。');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            let tagId = existingTag?.id ?? null;
            const tagCreated = !!parsed.tagName && !existingTag;
            if (tagCreated && parsed.tagName) {
                const tag: Tag = await api.tags.create({
                    name: parsed.tagName,
                });
                tagId = tag.id;
            }
            await api.tasks.create({
                title: parsed.title,
                due_date: parsed.dueDate,
                priority: parsed.priority,
                tag_id: tagId,
                status: 'todo',
            });
            toast.success(`「${parsed.title}」を追加しました。`);
            setValue('');
            onAdded(tagCreated);
        } catch (e) {
            const errors = getValidationErrors(e);
            setError(
                errors ? Object.values(errors)[0]?.[0] : getErrorMessage(e),
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
            className="space-y-1.5"
        >
            <div className="relative">
                <Plus className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setError(null);
                    }}
                    onKeyDown={(e) => {
                        // 日本語入力の変換を確定する Enter では追加しない
                        if (isImeEnter(e)) e.preventDefault();
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="タスクを追加（例：資料作成 明日15時 #仕事 !高）"
                    aria-label="タスクを追加"
                    aria-describedby={hintId}
                    aria-invalid={!!error}
                    enterKeyHint="done"
                    maxLength={300}
                    className="bg-background pr-10 pl-8"
                />
                {value.trim() && (
                    <Button
                        type="submit"
                        size="icon-sm"
                        variant="ghost"
                        disabled={submitting}
                        className="absolute top-1/2 right-1 -translate-y-1/2"
                        aria-label="追加"
                    >
                        <CornerDownLeft />
                    </Button>
                )}
            </div>

            <div id={hintId} className="min-h-5 px-1 text-xs">
                {error ? (
                    <p className="text-destructive">{error}</p>
                ) : parsed &&
                  (parsed.dueDate || parsed.tagName || parsed.priority) ? (
                    // 読み取った内容のプレビュー
                    <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
                        {parsed.dueDate && (
                            <span className="inline-flex items-center gap-1">
                                <CalendarClock className="size-3.5" />
                                {formatDateTime(parsed.dueDate)}
                            </span>
                        )}
                        {parsed.tagName && (
                            <Badge variant="outline">
                                <TagIcon />
                                {parsed.tagName}
                                {!existingTag && '（新しいタグ）'}
                            </Badge>
                        )}
                        {parsed.priority && (
                            <Badge
                                className={
                                    PRIORITY_BADGE_CLASSES[parsed.priority]
                                }
                            >
                                優先度 {PRIORITY_LABELS[parsed.priority]}
                            </Badge>
                        )}
                    </div>
                ) : (
                    focused && (
                        <p className="text-muted-foreground">
                            期限（明日・金曜・11/25・15時）、#タグ、!高・!中・!低
                            も一緒に書けます
                        </p>
                    )
                )}
            </div>
        </form>
    );
}
