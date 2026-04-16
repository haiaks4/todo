<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>{{ __('task.reminder.subject', ['title' => $task->title]) }}</h2>
        <p>
            {{ __('task.reminder.greeting', [
                'name' => $task->user->name,
                'date' => $task->due_date->format('Y年m月d日'),
            ]) }}
        </p>

        <table style="border-collapse:collapse; width:100%;">
            <tr>
                <th style="text-align:left; padding:8px; border-bottom:1px solid #e5e7eb;">
                    {{ __('validation.attributes.title') }}
                </th>
                <td style="padding:8px; border-bottom:1px solid #e5e7eb;">{{ $task->title }}</td>
            </tr>
            @if($task->description)
            <tr>
                <th style="text-align:left; padding:8px; border-bottom:1px solid #e5e7eb;">
                    {{ __('validation.attributes.description') }}
                </th>
                <td style="padding:8px; border-bottom:1px solid #e5e7eb;">{{ $task->description }}</td>
            </tr>
            @endif
            @if($task->priority)
            <tr>
                <th style="text-align:left; padding:8px; border-bottom:1px solid #e5e7eb;">
                    {{ __('validation.attributes.priority') }}
                </th>
                <td style="padding:8px; border-bottom:1px solid #e5e7eb;">
                    {{ __('task.priority.' . $task->priority) }}
                </td>
            </tr>
            @endif
        </table>

        <p style="margin-top:24px; color:#6b7280; font-size:14px;">
            {{ __('task.reminder.footer') }}
        </p>
    </div>
</body>
</html>
