<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'due_date'    => ['nullable', 'date'],
            'priority'    => ['nullable', 'in:high,medium,low'],
            'status'      => ['nullable', 'in:todo,in_progress,done'],
            'tag_id'      => ['nullable', 'integer', 'exists:tags,id'],
        ];
    }

    public function messages(): array
    {
        return __('validation') + [];
    }

    public function attributes(): array
    {
        return __('validation.attributes');
    }
}
