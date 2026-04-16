<?php

return [
    'reminder' => [
        'subject' => '【リマインド】タスクの期限が明日です: :title',
        'greeting' => ':nameさん、以下のタスクの期限が明日（:date）です。',
        'footer'  => 'このメールはリマインド通知が有効なアカウントに送信されています。通知を停止するにはマイページからリマインド設定をオフにしてください。',
    ],

    'priority' => [
        'high'   => '高',
        'medium' => '中',
        'low'    => '低',
    ],

    'status' => [
        'todo'        => '未着手',
        'in_progress' => '進行中',
        'done'        => '完了',
    ],
];
