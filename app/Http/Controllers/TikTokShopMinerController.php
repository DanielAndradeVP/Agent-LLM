<?php

namespace App\Http\Controllers;

use App\Services\TikTokShopMinerService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TikTokShopMinerController extends Controller
{
    public function __construct(private readonly TikTokShopMinerService $minerService)
    {
    }

    public function __invoke(Request $request)
    {
        try {
            $validated = $request->validate([
                'page' => ['nullable', 'integer', 'min:1'],
                'per_page' => ['nullable', 'integer', 'min:20', 'max:40'],
            ]);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => 'Invalid miner request.',
                'errors' => $exception->errors(),
            ], 422);
        }

        $page = (int) ($validated['page'] ?? 1);
        $perPage = (int) ($validated['per_page'] ?? 20);

        $result = $this->minerService->mine([
            'page' => $page,
            'per_page' => $perPage,
        ]);

        return response()->json([
            'data' => $result,
        ]);
    }
}
