<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;

class BulkDestroyTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer', 'exists:tasks,id'],
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
