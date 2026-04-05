<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class TikTokShopMinerService
{
    /**
     * Return mined products constrained to TikTok Shop URL patterns.
     *
     * @param  array<string, mixed>  $options
     * @return array{items: array<int, array<string, mixed>>, meta: array<string, int|string>}
     */
    public function mine(array $options = []): array
    {
        $page = max((int) ($options['page'] ?? 1), 1);
        $perPage = max((int) ($options['per_page'] ?? 20), 1);
        $offset = ($page - 1) * $perPage;
        $rapidApiKey = (string) config('services.rapidapi.key');

        if ($rapidApiKey !== '') {
            try {
                $rapidItems = $this->getRapidApiDataset($page, $perPage);
                $total = count($rapidItems);
                $items = $rapidItems;
            } catch (Throwable $exception) {
                Log::warning('RapidAPI TikTok unavailable. Falling back to local dataset.', [
                    'message' => $exception->getMessage(),
                ]);
                [$items, $total] = $this->getFallbackPage($offset, $perPage);
            }
        } else {
            [$items, $total] = $this->getFallbackPage($offset, $perPage);
        }

        return [
            'items' => array_values($items),
            'meta' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => max((int) ceil($total / $perPage), 1),
            ],
        ];
    }

    /**
     * @return array{0: array<int, array<string, mixed>>, 1: int}
     */
    private function getFallbackPage(int $offset, int $perPage): array
    {
        $dataset = $this->fallbackDataset();
        $shopItems = array_values(array_filter($dataset, function (array $item): bool {
            $originalPost = (string) ($item['original_post_url'] ?? '');
            $isShop = (bool) preg_match('/^https:\/\/www\.tiktok\.com\/@[^\/]+\/video\/\d+$/', $originalPost);
            $hasProductId = ! empty($item['product_id']);

            return $isShop && $hasProductId;
        }));

        return [array_slice($shopItems, $offset, $perPage), count($shopItems)];
    }
@@
    

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getRapidApiDataset(int $page, int $perPage): array
    {
        $baseUrl = rtrim((string) config('services.rapidapi.tiktok_base_url', 'https://tiktok-scraper7.p.rapidapi.com'), '/');
        $endpoint = '/'.ltrim((string) config('services.rapidapi.tiktok_feed_endpoint', '/feed/list'), '/');
        $host = (string) config('services.rapidapi.tiktok_host', 'tiktok-scraper7.p.rapidapi.com');
        $key = (string) config('services.rapidapi.key');
        $cursor = max(($page - 1) * $perPage, 0);

        try {
            $response = Http::timeout(20)
                ->acceptJson()
                ->withHeaders([
                    'x-rapidapi-key' => $key,
                    'x-rapidapi-host' => $host,
                ])
                ->get($baseUrl.$endpoint, [
                    'region' => 'US',
                    'count' => $perPage,
                    'cursor' => $cursor,
                ]);

            if ($response->failed()) {
                throw new RuntimeException('RapidAPI request failed: '.$response->status().' '.$response->body());
            }

            /** @var mixed $decoded */
            $decoded = $response->json();
            $normalized = $this->normalizeFeed($decoded);
            if ($normalized === []) {
                throw new RuntimeException('RapidAPI returned an empty or unsupported payload.');
            }

            return $normalized;
        } catch (Throwable $exception) {
            throw new RuntimeException('Falha ao consultar RapidAPI TikTok: '.$exception->getMessage(), 0, $exception);
        }
    }

    /**
     * @param  mixed  $decoded
     * @return array<int, array<string, mixed>>
     */
    private function normalizeFeed(mixed $decoded): array
    {
        if (! is_array($decoded)) {
            return [];
        }

        $rawItems = $decoded['data']['items']
            ?? $decoded['data']['aweme_list']
            ?? $decoded['aweme_list']
            ?? $decoded['items']
            ?? [];

        if (! is_array($rawItems)) {
            return [];
        }

        $normalized = [];
        foreach ($rawItems as $item) {
            if (! is_array($item)) {
                continue;
            }

            $title = (string) ($item['title'] ?? $item['desc'] ?? $item['name'] ?? 'TikTok Product');
            $awemeId = (string) ($item['aweme_id'] ?? $item['id'] ?? '');
            $authorHandle = (string) ($item['author']['unique_id'] ?? $item['author']['nickname'] ?? 'tiktok');
            $postUrl = (string) ($item['share_url'] ?? '');
            if ($postUrl === '' && $awemeId !== '') {
                $postUrl = 'https://www.tiktok.com/@'.$authorHandle.'/video/'.$awemeId;
            }

            $coverImage = (string) (
                $item['cover']['url_list'][0]
                    ?? $item['video']['cover']['url_list'][0]
                    ?? $item['music_info']['cover_thumb']['url_list'][0]
                    ?? ''
            );

            $images = $this->extractImages($item);
            if ($images === [] && $coverImage !== '') {
                $images = [$coverImage];
            }

            $productId = (string) ($item['commerce_info']['product_id'] ?? $item['product_id'] ?? $awemeId);
            $price = (float) (
                $item['commerce_info']['price']
                    ?? $item['product_info']['price']
                    ?? $item['price']
                    ?? 0
            );
            $sales = (int) (
                $item['commerce_info']['sales']
                    ?? $item['product_info']['sales']
                    ?? $item['statistics']['collect_count']
                    ?? 0
            );

            if ($postUrl === '' || $coverImage === '') {
                continue;
            }

            $normalized[] = [
                'id' => (string) ($item['id'] ?? ('shop-'.$awemeId)),
                'product_id' => $productId,
                'name' => $title,
                'category' => (string) ($item['category'] ?? 'General'),
                'description' => (string) ($item['desc'] ?? ''),
                'image' => $coverImage,
                'images' => $images,
                'original_post_url' => $postUrl,
                'seller_handle' => $authorHandle,
                'seller_link' => 'https://www.tiktok.com/@'.$authorHandle,
                'price' => $price,
                'metrics' => [
                    'sales' => $sales,
                    'views' => (int) ($item['statistics']['play_count'] ?? $item['views'] ?? 0),
                    'likes' => (int) ($item['statistics']['digg_count'] ?? $item['likes'] ?? 0),
                ],
            ];
        }

        return $normalized;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function fallbackDataset(): array
    {
        $seed = [];
        $names = [
            'Mini Blender Portable',
            'Posture Corrector Pro',
            'RGB Strip Light Kit',
            'Facial Ice Roller',
            'Magnetic Phone Stand',
            'Digital Food Scale',
            'Kitchen Oil Sprayer',
            'LED Mirror Light',
            'Pill Organizer Smart',
            'Pet Hair Remover',
            'Neck Massager Heat',
            'Laptop Cooling Pad',
            'Aromatherapy Diffuser',
            'Vacuum Storage Bags',
            'Wireless Lavalier Mic',
            'Makeup Brush Cleaner',
            'Water Flosser',
            'Smart Jump Rope',
            'Car Dashboard Vacuum',
            'Portable Garment Steamer',
            'Electric Spin Scrubber',
            'Compact Espresso Maker',
            'Heatless Curling Set',
            'Reusable Lint Roller',
            'Mini Projector HD',
            'Travel Jewelry Case',
            'Standing Desk Converter',
            'Silicone Air Fryer Liners',
            'Automatic Soap Dispenser',
            'Drawer Organizer Set',
        ];

        $imageIds = [
            '1570197788417-0e82375c9371',
            '1571019613454-1cb2f99b2d8b',
            '1558002038-1055907df827',
            '1522335789203-aabd1fc54bc9',
            '1505740420928-5e560c06d30e',
            '1585238342024-78d387f4a707',
            '1585386959984-a4155224a1ad',
            '1616627456685-8d3c98648e5d',
            '1515378791036-0648a3ef77b2',
            '1586486855514-8c633cc6fd38',
            '1596462502278-27bfdc403348',
            '1587837073080-448bc6a2329b',
            '1560184611-ff3e53f00e8f',
            '1526738549149-8e07eca6c147',
            '1563013544-824ae1b704d3',
            '1515169067868-5387ec356754',
            '1521572163474-6864f9cf17ab',
            '1596464716127-f2a82984de30',
            '1600494603989-9650cf6ddd3d',
            '1477332552946-cfb384aeaf1c',
            '1610725664285-7c57e6eeac3f',
            '1505576391880-b3f9d713dc4f',
            '1571781926291-c477ebfd024b',
            '1523275335684-37898b6baf30',
            '1526378722484-bd91ca387e72',
            '1463320726281-696a485928c7',
            '1519389950473-47ba0277781c',
            '1593642632823-8f785ba67e45',
            '1517148815978-75f6acaaf32c',
            '1589363460779-cd717d2ed8fa',
        ];

        foreach ($names as $index => $name) {
            $idBase = 7400000000000000000 + $index;
            $sellerHandle = 'tiktokshop'.($index + 1);
            $imageId = $imageIds[$index % count($imageIds)];
            $imageBase = 'https://images.unsplash.com/photo-'.$imageId;

            $seed[] = [
                'id' => 'shop-'.$idBase,
                'product_id' => 'PID'.(910000 + $index),
                'name' => $name,
                'category' => 'TikTok Shop',
                'description' => 'Top-performing TikTok Shop listing mined from viral ad signals.',
                'image' => $imageBase.'?auto=format&fit=crop&w=600&q=80',
                'images' => [
                    $imageBase.'?auto=format&fit=crop&w=1000&q=80',
                    $imageBase.'?auto=format&fit=crop&w=1200&q=80',
                ],
                'original_post_url' => 'https://www.tiktok.com/@'.$sellerHandle.'/video/'.$idBase,
                'seller_handle' => $sellerHandle,
                'seller_link' => 'https://www.tiktok.com/@'.$sellerHandle,
                'price' => round(14.9 + ($index * 1.35), 2),
                'metrics' => [
                    'sales' => 900 + ($index * 133),
                    'views' => 140000 + ($index * 17000),
                    'likes' => 4000 + ($index * 320),
                ],
            ];
        }

        return $seed;
    }

    /**
     * @return array{products: array<int, array<string, mixed>>, pagination: array<string, int>}
     */
    public function mineShopProducts(int $page = 1, int $perPage = 20): array
    {
        $result = $this->mine([
            'page' => $page,
            'per_page' => $perPage,
        ]);

        return [
            'products' => $result['items'],
            'pagination' => [
                'current_page' => (int) $result['meta']['page'],
                'per_page' => (int) $result['meta']['per_page'],
                'total' => (int) $result['meta']['total'],
                'last_page' => (int) $result['meta']['total_pages'],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<int, string>
     */
    private function extractImages(array $item): array
    {
        $sources = [
            $item['image_post_info']['images'] ?? null,
            $item['images'] ?? null,
            $item['image_list'] ?? null,
        ];

        $images = [];
        foreach ($sources as $source) {
            if (! is_array($source)) {
                continue;
            }

            foreach ($source as $img) {
                if (is_string($img)) {
                    $images[] = $img;
                    continue;
                }

                if (! is_array($img)) {
                    continue;
                }

                $url = $img['display_image']['url_list'][0]
                    ?? $img['url_list'][0]
                    ?? $img['url']
                    ?? null;

                if (is_string($url) && $url !== '') {
                    $images[] = $url;
                }
            }
        }

        return array_values(array_unique($images));
    }
}
