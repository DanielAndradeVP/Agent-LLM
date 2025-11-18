<?php

namespace App\Domains\Home\Repositories;

use App\Domains\Home\Entities\HomeEntity;
use App\Domains\Abstracts\AbstractRepository;

class HomeRepository extends AbstractRepository
{
    public function __construct(HomeEntity $model)
    {
        $this->model = $model;
    }
}
