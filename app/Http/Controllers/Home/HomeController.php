<?php

namespace App\Http\Controllers\Home;

use App\Http\Controllers\AbstractController;
use App\Domains\Home\Services\HomeService;


class HomeController extends AbstractController
{
    public function __construct(HomeService $service)
    {
        $this->service = $service;
    }
}
