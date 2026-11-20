<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;
use App\Support\Recurrence;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'recurrence'  => ['nullable', Rule::in(Recurrence::ALL)],
            'status'      => ['sometimes', 'required', 'in:todo,in_progress,done'],
            'tag_id'      => ['nullable', 'integer', Rule::exists('tags', 'id')->where('user_id', $this->user()->id)->whereNull('deleted_at')],
            'project_id'  => ['nullable', 'integer', Rule::exists('projects', 'id')->where('user_id', $this->user()->id)],
        ];
    }

    /** 繰り返すには期限が必要（項目の一部だけを更新する場合は、今の値と合わせて判断する） */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $task = $this->route('task');
                $recurrence = $this->has('recurrence') ? $this->input('recurrence') : $task?->recurrence;
                $due = $this->has('due_date') ? $this->input('due_date') : $task?->due_date;

                if ($recurrence !== null && empty($due)) {
                    $validator->errors()->add('due_date', __('task.recurrence_requires_due_date'));
                }
            },
        ];
    }
}
