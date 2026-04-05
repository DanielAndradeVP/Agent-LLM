<?php

use App\Http\Controllers\PromptGeneratorController;
use App\Http\Controllers\TikTokShopMinerController;
use App\Http\Controllers\ApiSettingsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', function () {
    return Inertia::render('home/Index');
});

Route::post('/prompt-generator/generate', PromptGeneratorController::class);
Route::get('/miner/tiktok-shop', TikTokShopMinerController::class);
Route::get('/api/settings', [ApiSettingsController::class, 'show']);
Route::post('/api/settings', [ApiSettingsController::class, 'update']);
