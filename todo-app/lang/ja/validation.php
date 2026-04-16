<?php

return [
    'required'    => ':attributeは必須です。',
    'string'      => ':attributeは文字列で入力してください。',
    'max'         => [
        'string' => ':attributeは:max文字以内で入力してください。',
    ],
    'min'         => [
        'string' => ':attributeは:min文字以上で入力してください。',
    ],
    'in'          => ':attributeに無効な値が指定されています。',
    'date'        => ':attributeは有効な日付形式で入力してください。',
    'boolean'     => ':attributeはtrue/falseで指定してください。',
    'array'       => ':attributeは配列で指定してください。',
    'integer'     => ':attributeは整数で指定してください。',
    'exists'      => '選択された:attributeは存在しません。',
    'nullable'    => ':attributeはnullを指定できます。',
    'current_password' => '現在のパスワードが正しくありません。',
    'confirmed'   => ':attributeの確認が一致しません。',
    'email'       => ':attributeは有効なメールアドレス形式で入力してください。',
    'unique'      => ':attributeはすでに使用されています。',
    'lowercase'   => ':attributeは小文字で入力してください。',

    'custom' => [
        'ids'   => [
            'required' => '削除するタスクを選択してください。',
            'array'    => '無効なリクエストです。',
        ],
        'ids.*' => [
            'integer' => '無効なタスクIDです。',
            'exists'  => '指定されたタスクは存在しません。',
        ],
    ],

    'attributes' => [
        'title'          => 'タイトル',
        'description'    => '説明',
        'due_date'       => '期限',
        'priority'       => '優先度',
        'status'         => 'ステータス',
        'tag_id'         => 'タグ',
        'name'           => 'タグ名',
        'ids'            => 'タスク',
        'remind_enabled' => 'リマインド設定',
        'email'          => 'メールアドレス',
        'password'       => 'パスワード',
    ],
];
