<?php

namespace App\Domains\Abstracts;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

abstract class AbstractRepository implements RepositoryInterface
{
    /**
     * @var Model
     */
    protected $model;

    public function getModel(): Model
    {
        return $this->model;
    }

    public function all(
        array $params = [],
        array $with = [],
        array $options = [],
    ) {
        $model = $this->getModel();
        $orderByColumn = data_get($options, 'order_by.column', 'id');
        $orderByDirection = data_get($options, 'order_by.direction', 'asc');
        $perPage = data_get($options, 'per_page', 20);
        $columns = data_get($options, 'columns', '*');
        $columns = is_array($columns) ? $columns : explode(',', $columns);

        $params = array_filter(
            $params,
            fn ($key) => in_array($key, $model->getFillable()),
            ARRAY_FILTER_USE_KEY
        );

        return $model->with($with)
            ->where($params)
            ->orderBy($orderByColumn, $orderByDirection)
            ->paginate($perPage, $columns)
            ->withQueryString();
    }

    public function allWithOutPaginate(
        $params = [],
        array $with = [],
        array $options = []
    ): Collection {
        $model = $this->getModel();
        $orderByColumn = data_get($options, 'order_by.column', 'id');
        $orderByDirection = data_get($options, 'order_by.direction', 'asc');
        $columns = data_get($options, 'columns', '*');
        $columns = is_array($columns) ? $columns : explode(',', $columns);
        $limit = data_get($options, 'limit');

        $params = array_filter(
            $params,
            fn ($key) => in_array($key, $model->getFillable()),
            ARRAY_FILTER_USE_KEY
        );

        return $model->with($with)
            ->where($params)
            ->orderBy($orderByColumn, $orderByDirection)
            ->limit($limit)
            ->get($columns);
    }

    /**
     * Retorna em forma de lista para selecte
     *
     * @return mixed
     */
    public function list($sortBy = 'name', $pluck = 'name'): array
    {
        return $this->getModel()->all()->sortBy($sortBy)->pluck($pluck, 'id')->all();
    }

    public function create($params): Model
    {
        $params = $this->filterParamsByFillable($params);

        return $this->getModel()->forceCreate($params);
    }

    /**
     * @param  array  $with
     * @return mixed
     */
    public function find($id, $with = [])
    {

        if (is_numeric($id)) {
            return $this->getModel()->with($with)->find($id);
        }

        return $this->findOneWhere(['uuid' => $id], $with);
    }

    /**
     * @return mixed
     */
    public function findOrFail($id)
    {
        return $this->getModel()->findOrFail($id);
    }

    /**
     * Usário logado
     *
     * @return mixed
     */
    public function findByUserAuth(array $params)
    {
        if (isset($params['id_user']) && ! empty($params['id_user'])) {
            return $this->findOrFail($params['id_user']);
        }

        return Auth::user()->id;
    }

    public function delete($id)
    {
        $model = $this->find($id);
        $model->delete();
    }

    public function update(Model $entity, $data)
    {
        $data = $this->filterParamsByFillable($data);

        return $entity->forceFill($data)->save();
    }

    /**
     * @param  array  $with
     * @return mixed
     */
    public function where(array $where, $with = [])
    {
        return $this->getModel()->where($where)->with($with)->get();
    }

    /**
     * Delete com condição
     */
    public function deleteWhere($where)
    {
        $this->getModel()->where($where)->delete();
    }

    /**
     * Retorna o primeiro registro encontrado
     *
     * @return mixed
     */
    public function findOneWhere(array $where, $with = [])
    {
        $object = $this->where($where, $with);

        return $object->first();
    }

    /**
     * Retorna o ID pelo UUID
     *
     * @return mixed
     */
    public function getIdByUuid(string $uuid)
    {
        return $this->findOneWhere(['uuid' => $uuid])->id;
    }

    /**
     * getAttribute
     *
     * @param  mixed  $value
     * @return void
     */
    public function getAttribute($params, $value, $default = null)
    {
        return (isset($params[$value])) ? $params[$value] : $default;
    }

    protected function filterParamsByFillable(array $params): array
    {
        $model = $this->getModel();

        return array_filter(
            $params,
            fn ($key) => in_array($key, $model->getFillable()),
            ARRAY_FILTER_USE_KEY
        );
    }
}
