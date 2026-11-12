<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'description' => ['nullable', 'string', 'max:10000'],
            'due_date'    => ['nullable', 'date'],
            'priority'    => ['nullable', 'in:high,medium,low'],
            'status'      => ['sometimes', 'required', 'in:todo,in_progress,done'],
            'tag_id'      => ['nullable', 'integer', Rule::exists('tags', 'id')->where('user_id', $this->user()->id)->whereNull('deleted_at')],
        ];
    }
}
