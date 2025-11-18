<?php

namespace App\Domains\Home\Services;

use App\Domains\Home\Repositories\HomeRepository;
use App\Domains\Abstracts\AbstractService;

class HomeService extends AbstractService
{
    public function __construct(HomeRepository $repository)
    {
        $this->repository = $repository;
    }
}
