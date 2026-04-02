<?php

use App\Http\Controllers\PromptGeneratorController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', function () {
    return Inertia::render('home/Index');
});

Route::post('/prompt-generator/generate', PromptGeneratorController::class);
