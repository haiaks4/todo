<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:50',
                // 同じユーザーの中で名前が重ならないようにする
                Rule::unique('projects', 'name')
                    ->where('user_id', $this->user()->id),
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'プロジェクト名',
        ];
    }
}
