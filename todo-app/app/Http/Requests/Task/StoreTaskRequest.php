<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;
use App\Support\Recurrence;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'due_date'    => ['nullable', 'date'],
            'priority'    => ['nullable', 'in:high,medium,low'],
            'recurrence'  => ['nullable', Rule::in(Recurrence::ALL)],
            'status'      => ['nullable', 'in:todo,in_progress,done'],
            'tag_id'      => ['nullable', 'integer', Rule::exists('tags', 'id')->where('user_id', $this->user()->id)->whereNull('deleted_at')],
        ];
    }

    /** 繰り返すには期限が必要 */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->filled('recurrence') && ! $this->filled('due_date')) {
                    $validator->errors()->add('due_date', __('task.recurrence_requires_due_date'));
                }
            },
        ];
    }
}
