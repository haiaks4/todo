<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RestoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids'   => ['required', 'array', 'max:1000'],
            'ids.*' => ['integer', 'distinct', Rule::exists('tasks', 'id')->where('user_id', $this->user()->id)->whereNotNull('deleted_at')],
        ];
    }
}
