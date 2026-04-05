<?php

namespace App\Http\Controllers;

use App\Models\ApiSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

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

        $envPath = base_path('.env');
        if (! file_exists($envPath)) {
            return response()->json([
                'message' => 'Arquivo .env nao encontrado no servidor.',
            ], 500);
        }

        if (! is_writable($envPath)) {
            return response()->json([
                'message' => 'Arquivo .env sem permissao de escrita.',
            ], 500);
        }

        $envUpdates = [
            'OPENAI_API_KEY' => $validated['openaiApiKey'] ?? null,
            'DID_API_KEY' => $validated['didApiKey'] ?? null,
            'TIKTOK_SHOP_APP_KEY' => $validated['tiktokAppKey'] ?? null,
            'TIKTOK_SHOP_APP_SECRET' => $validated['tiktokAppSecret'] ?? null,
            'TIKTOK_SHOP_ACCESS_TOKEN' => $validated['tiktokAccessToken'] ?? null,
        ];

        try {
            $this->writeEnvValues($envPath, $envUpdates);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 500);
        }

        ApiSetting::putValue('openai_api_key', $validated['openaiApiKey'] ?? null);
        ApiSetting::putValue('did_api_key', $validated['didApiKey'] ?? null);
        ApiSetting::putValue('tiktok_app_key', $validated['tiktokAppKey'] ?? null);
        ApiSetting::putValue('tiktok_app_secret', $validated['tiktokAppSecret'] ?? null);
        ApiSetting::putValue('tiktok_access_token', $validated['tiktokAccessToken'] ?? null);

        try {
            Artisan::call('config:clear');
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Chaves salvas, mas falhou ao limpar cache de configuracao.',
            ], 500);
        }

        return response()->json([
            'data' => [
                'openaiConfigured' => ! blank(ApiSetting::getValue('openai_api_key')),
                'didConfigured' => ! blank(ApiSetting::getValue('did_api_key')),
                'tiktokConfigured' => ! blank(ApiSetting::getValue('tiktok_app_key'))
                    && ! blank(ApiSetting::getValue('tiktok_app_secret'))
                    && ! blank(ApiSetting::getValue('tiktok_access_token')),
            ],
            'message' => 'Sucesso!',
        ]);
    }

    /**
     * @param  array<string, string|null>  $updates
     */
    private function writeEnvValues(string $path, array $updates): void
    {
        $content = file_get_contents($path);
        if ($content === false) {
            throw new RuntimeException('Falha ao ler arquivo .env.');
        }

        foreach ($updates as $key => $rawValue) {
            if (blank($rawValue)) {
                continue;
            }

            $value = $this->formatEnvValue($rawValue);
            $line = $key.'='.$value;
            $pattern = '/^'.preg_quote($key, '/').'=.*/m';

            if (preg_match($pattern, $content) === 1) {
                $replaced = preg_replace($pattern, $line, $content, 1);
                if ($replaced === null) {
                    throw new RuntimeException('Falha ao atualizar chave '.$key.' no .env.');
                }
                $content = $replaced;
            } else {
                $content .= rtrim(PHP_EOL).$line.PHP_EOL;
            }
        }

        if (file_put_contents($path, $content) === false) {
            throw new RuntimeException('Falha ao gravar arquivo .env.');
        }
    }

    private function formatEnvValue(string $value): string
    {
        if (preg_match('/^[A-Za-z0-9_\-\.\/]+$/', $value) === 1) {
            return $value;
        }

        return '"'.addcslashes($value, "\\\"$").'"';
    }
}
