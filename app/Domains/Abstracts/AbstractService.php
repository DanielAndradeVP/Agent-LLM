<?php

namespace App\Domains\Abstracts;

use Illuminate\Database\Eloquent\Collection;

abstract class AbstractService implements ServiceInterface
{
    protected $with = [];

    protected $repository;

    public function getAll(array $params = [], array $options = [])
    {
        $this->with = data_get($options, 'with', []);

        return $this->getRepository()->all($params, $this->with, $options);
    }

    public function getAllWithoutPagination(
        array $params = [],
        array $with = [],
        array $options = [],
    ): Collection {
        return $this->getRepository()->allWithOutPaginate($params, $with, $options);
    }

    /**
     * @throws \Exception
     */
    public function find($id, array $with = []): mixed
    {
        $result = $this->repository->find($id, $with);
        if ($result == null) {
            throw new \Exception('Objeto não encontrado na base de dados', 404);
        }

        return $result;
    }

    public function beforeSave(array $data): array
    {
        return $data;
    }

    public function beforeUpdate($id, array $data): array
    {
        return $data;
    }

    /**
     * @throws \Exception
     */
    public function save(array $data): mixed
    {
        $data = $this->beforeSave($data);
        if ($this->validateOnInsert($data) !== false) {
            $entity = $this->repository->create($data);
            $this->afterSave($entity, $data);

            return $entity;
        }

        throw new \Exception('Validação falhou ao salvar o registro', 422);
    }

    public function afterSave($entity, array $params)
    {
        return $entity;
    }

    /**
     * @throws \Exception
     */
    public function update($id, array $data): mixed
    {
        $data = $this->beforeUpdate($id, $data);
        if ($this->validateOnUpdate($id, $data) === false) {
            throw new \Exception('Validação falhou ao atualizar o registro', 422);
        }
        $entity = $this->find($id);
        $this->afterUpdate($entity, $data);

        return $this->repository->update($entity, $data);
    }

    public function afterUpdate($entity, array $params) {}

    public function beforeDelete($id): mixed
    {
        return $id;
    }

    /**
     * @return mixed
     *
     * @throws \Exception
     */
    public function delete($id)
    {
        $this->validateOnDelete($id);
        $this->beforeDelete($id);
        $this->repository->delete($id);

        return $this->afterDelete($id);
    }

    public function afterDelete($id): mixed
    {
        return $id;
    }

    public function validateOnInsert(array $params): bool
    {
        return true;
    }

    public function validateOnUpdate($id, array $params): bool
    {
        return true;
    }

    /**
     * @throws \Exception
     */
    public function validateOnDelete($id)
    {
        $result = $this->getRepository()->find($id);
        if ($result == null) {
            throw new \Exception('Objeto não encontrado na base de dados');
        }
    }

    public function getRepository(): RepositoryInterface
    {
        return $this->repository;
    }

    /**
     * Simples criação, sem validações
     *
     * @return mixed
     */
    public function create(array $data)
    {
        $entity = $this->repository->create($data);
        $this->afterSave($entity, $data);

        return $entity;
    }
}
