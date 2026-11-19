import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';

export default function UpdateRemindForm({
    remindEnabled,
}: {
    remindEnabled: boolean;
}) {
    const [enabled, setEnabled] = useState(remindEnabled);
    const [processing, setProcessing] = useState(false);

    // スイッチを切り替えたらすぐに保存する
    const toggle = (checked: boolean) => {
        setEnabled(checked);
        router.patch(
            route('profile.remind'),
            { remind_enabled: checked },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () =>
                    toast.success(
                        checked
                            ? 'リマインド通知をオンにしました。'
                            : 'リマインド通知をオフにしました。',
                    ),
                onError: () => {
                    setEnabled(!checked);
                    toast.error('保存できませんでした。');
                },
            },
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>リマインド通知</CardTitle>
                <CardDescription>
                    オンにすると、期限が翌日のタスクを毎朝メールでお知らせします。
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-3">
                    <Switch
                        id="remind_enabled"
                        checked={enabled}
                        disabled={processing}
                        onCheckedChange={toggle}
                    />
                    <Label htmlFor="remind_enabled" className="font-normal">
                        リマインドメールを受け取る
                    </Label>
                </div>
            </CardContent>
        </Card>
    );
}
