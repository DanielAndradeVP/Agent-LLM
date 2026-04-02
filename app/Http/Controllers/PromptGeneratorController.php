<?php

namespace App\Http\Controllers;

use App\Models\ApiSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class PromptGeneratorController extends Controller
{
    public function __invoke(Request $request)
    {
        try {
            $validated = $request->validate([
                'product' => ['required', 'array'],
                'product.name' => ['required', 'string'],
                'product.productId' => ['nullable', 'string'],
                'product.sellerLink' => ['nullable', 'string'],
                'product.category' => ['required', 'string'],
                'product.description' => ['required', 'string'],
                'product.metrics' => ['required', 'array'],
                'product.metrics.sales' => ['required', 'numeric'],
                'product.originalPost' => ['required', 'string'],
                'model' => ['required', 'array'],
                'model.name' => ['required', 'string'],
                'model.description' => ['required', 'string'],
                'settings' => ['required', 'array'],
                'settings.voiceGender' => ['required', 'string'],
                'settings.voiceTone' => ['required', 'string'],
                'settings.movementPose' => ['required', 'string'],
                'settings.formatType' => ['required', 'string'],
                'settings.scenario' => ['required', 'string'],
            ]);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => 'Invalid prompt generator payload.',
                'errors' => $exception->errors(),
            ], 422);
        }

        $apiKey = ApiSetting::getValue('openai_api_key') ?? config('services.openai.api_key');
        $model = config('services.openai.model', 'gpt-4.1-mini');

        if (blank($apiKey)) {
            return response()->json([
                'message' => 'Configuracao Necessaria: OpenAI API key ausente.',
            ], 422);
        }

        $systemPrompt = <<<'PROMPT'
You are an elite creative director for UGC ads.
Generate one high-quality English prompt for image/video generation tools (Flow, Krea, Flux).

Output rules:
- Return plain text only.
- No markdown.
- Keep to 140-220 words.
- Include camera style, lighting, composition, subject details, motion, and product focus.
- Keep it commercially effective and cinematic.
- Mention ad-ready realism and high conversion intent.
PROMPT;

        $userPrompt = sprintf(
            "Product Data:\n- Name: %s\n- Product ID: %s\n- Seller Link: %s\n- Category: %s\n- Description: %s\n- Sales: %s\n- Original Viral Post: %s\n\nModel Data:\n- Name: %s\n- Description: %s\n\nCreative Controls:\n- Voice Gender: %s\n- Voice Tone: %s\n- Movement/Pose: %s\n- Format: %s\n- Scenario: %s\n\nGenerate a single final prompt in English.",
            $validated['product']['name'],
            $validated['product']['productId'] ?? 'N/A',
            $validated['product']['sellerLink'] ?? 'N/A',
            $validated['product']['category'],
            $validated['product']['description'],
            number_format((float) $validated['product']['metrics']['sales'], 0, '.', ','),
            $validated['product']['originalPost'],
            $validated['model']['name'],
            $validated['model']['description'],
            $validated['settings']['voiceGender'],
            $validated['settings']['voiceTone'],
            $validated['settings']['movementPose'],
            $validated['settings']['formatType'],
            $validated['settings']['scenario']
        );

        try {
            $response = Http::timeout(45)
                ->withToken($apiKey)
                ->acceptJson()
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userPrompt],
                    ],
                    'temperature' => 0.7,
                ]);

            if ($response->failed()) {
                Log::warning('OpenAI request failed for prompt generation.', [
                    'status' => $response->status(),
                    'body' => $response->json(),
                ]);

                return response()->json([
                    'message' => 'OpenAI request failed.',
                    'error' => $response->json(),
                ], $response->status());
            }

            $prompt = data_get($response->json(), 'choices.0.message.content', '');

            return response()->json([
                'data' => [
                    'prompt' => trim((string) $prompt),
                ],
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Unexpected server error during prompt generation.',
            ], 500);
        }
    }
}
