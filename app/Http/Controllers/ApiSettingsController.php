<?php

namespace App\Http\Controllers;

use App\Models\ApiSetting;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ApiSettingsController extends Controller
{
    public function show()
    {
        return response()->json([
            'data' => [
                'openaiConfigured' => ! blank(ApiSetting::getValue('openai_api_key')),
                'didConfigured' => ! blank(ApiSetting::getValue('did_api_key')),
                'tiktokConfigured' => ! blank(ApiSetting::getValue('tiktok_app_key'))
                    && ! blank(ApiSetting::getValue('tiktok_app_secret'))
                    && ! blank(ApiSetting::getValue('tiktok_access_token')),
            ],
        ]);
    }

    public function update(Request $request)
    {
        try {
            $validated = $request->validate([
                'openaiApiKey' => ['nullable', 'string', 'max:5000'],
                'didApiKey' => ['nullable', 'string', 'max:5000'],
                'tiktokAppKey' => ['nullable', 'string', 'max:5000'],
                'tiktokAppSecret' => ['nullable', 'string', 'max:5000'],
                'tiktokAccessToken' => ['nullable', 'string', 'max:10000'],
            ]);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => 'Invalid API settings payload.',
                'errors' => $exception->errors(),
            ], 422);
        }

        ApiSetting::putValue('openai_api_key', $validated['openaiApiKey'] ?? null);
        ApiSetting::putValue('did_api_key', $validated['didApiKey'] ?? null);
        ApiSetting::putValue('tiktok_app_key', $validated['tiktokAppKey'] ?? null);
        ApiSetting::putValue('tiktok_app_secret', $validated['tiktokAppSecret'] ?? null);
        ApiSetting::putValue('tiktok_access_token', $validated['tiktokAccessToken'] ?? null);

        return response()->json([
            'data' => [
                'openaiConfigured' => ! blank(ApiSetting::getValue('openai_api_key')),
                'didConfigured' => ! blank(ApiSetting::getValue('did_api_key')),
                'tiktokConfigured' => ! blank(ApiSetting::getValue('tiktok_app_key'))
                    && ! blank(ApiSetting::getValue('tiktok_app_secret'))
                    && ! blank(ApiSetting::getValue('tiktok_access_token')),
            ],
            'message' => 'API settings saved.',
        ]);
    }
}
