<?php

namespace App\Http\Requests;

use App\Models\Invitation;
use Illuminate\Foundation\Http\FormRequest;

class ReorderSectionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $invitation = $this->route('invitation');

        return $invitation instanceof Invitation
            && $this->user()->can('update', $invitation);
    }

    public function rules(): array
    {
        return [
            'sections' => ['required', 'array', 'min:1'],
            'sections.*.id' => ['required', 'integer', 'distinct'],
            'sections.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }
}
