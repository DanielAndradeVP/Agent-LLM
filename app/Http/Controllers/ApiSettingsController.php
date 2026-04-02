<?php

namespace App\Http\Controllers;

use App\Models\ApiSetting;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ApiSettingsController extends Controller
{
    public function show()
    {
        $setting = ApiSetting::query()->first();

        return response()->json([
            'data' => [
                'openaiConfigured' => ! blank($setting?->openai_api_key),
                'didConfigured' => ! blank($setting?->did_api_key),
                'warningRequired' => blank($setting?->openai_api_key) || blank($setting?->did_api_key),
            ],
        ]);
    }

    public function update(Request $request)
    {
        try {
            $validated = $request->validate([
                'openaiApiKey' => ['nullable', 'string', 'max:5000'],
                'didApiKey' => ['nullable', 'string', 'max:5000'],
            ]);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => 'Invalid API settings payload.',
                'errors' => $exception->errors(),
            ], 422);
        }

        $setting = ApiSetting::query()->firstOrNew(['id' => 1]);

        if (! empty($validated['openaiApiKey'])) {
            $setting->openai_api_key = $validated['openaiApiKey'];
        }

        if (! empty($validated['didApiKey'])) {
            $setting->did_api_key = $validated['didApiKey'];
        }

        $setting->save();

        return response()->json([
            'data' => [
                'openaiConfigured' => ! blank($setting->openai_api_key),
                'didConfigured' => ! blank($setting->did_api_key),
                'warningRequired' => blank($setting->openai_api_key) || blank($setting->did_api_key),
            ],
            'message' => 'API settings saved.',
        ]);
    }
}
