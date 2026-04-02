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
            'data' => [
                'products' => array_map(function (array $item): array {
                    return [
                        'id' => $item['id'],
                        'product_id' => $item['product_id'],
                        'name' => $item['name'],
                        'category' => $item['category'],
                        'description' => $item['description'],
                        'image' => $item['image'],
                        'images' => $item['images'],
                        'original_post' => $item['original_post_url'],
                        'seller_link' => $item['seller_link'],
                        'metrics' => [
                            'views' => $item['views'],
                            'sales' => $item['sales'],
                            'likes' => $item['likes'],
                        ],
                    ];
                }, $result['items']),
                'pagination' => [
                    'current_page' => $result['meta']['page'],
                    'per_page' => $result['meta']['per_page'],
                    'total' => $result['meta']['total'],
                    'last_page' => $result['meta']['total_pages'],
                ],
            ],
        ]);
    }
}
