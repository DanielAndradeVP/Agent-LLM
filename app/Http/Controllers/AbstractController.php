<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

abstract class AbstractController extends Controller
{
    protected $with = [];

    protected $service;

    protected $requestValidate;

    protected $requestValidateUpdate;

    /**
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $this->with = $request->get('with', []);
        $withoutPagination = filter_var(
            $request->get('without_pagination', false),
            FILTER_VALIDATE_BOOLEAN
        );
        $orderByColumn = $request->get('order_by_column', 'id');
        $orderByDirection = $request->get('order_by_direction', 'asc');
        $columns = $request->get('columns', '*');
        $perPage = $request->get('per_page', 20);

        if ($withoutPagination) {
            $items = $this->service->getAllWithoutPagination($request->all(), $this->with, [
                'order_by' => [
                    'column' => $orderByColumn,
                    'direction' => $orderByDirection,
                ],
                'columns' => $columns,
            ]);

            return $this->ok($items->toArray());
        }

        $items = $this
            ->service
            ->getAll($request->all(), [
                'order_by' => [
                    'column' => $orderByColumn,
                    'direction' => $orderByDirection,
                ],
                'columns' => $columns,
                'per_page' => $perPage,
                'with' => $this->with,
            ]);

        return $this->ok($items->toArray());
    }

    /**
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        if ($this->requestValidate) {
            $requestValidate = app($this->requestValidate);
            $request->validate($requestValidate->rules());
        }

        DB::beginTransaction();
        try {
            $params = $request->all();
            data_set($params, 'created_by', $request->user()->id ?? null);
            data_set($params, 'origin', $request->header('X-Client-Type'));
            $response = $this->service->save($params);
            DB::commit();

            return $this->success($this->messageSuccessDefault, ['response' => $response]);
        } catch (\Throwable $e) {
            DB::rollBack();
            if ($e instanceof ValidationException) {
                return $this->error($this->messageErrorDefault, $e->errors());
            }
            if ($e instanceof Exception) {
                return $this->error($e->getMessage());
            }
        }
    }

    /**
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        if (! empty($this->requestValidateUpdate)) {
            $requestValidateUpdate = app($this->requestValidateUpdate);
            $request->validate($requestValidateUpdate->rules());
        }

        DB::beginTransaction();
        try {
            $params = $request->all();
            data_set($params, 'updated_by', $request->user()->id ?? null);
            $this->service->update($id, $params);
            DB::commit();

            return $this->success($this->messageSuccessDefault);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $this->with = request()->get('with', []);

        return $this->ok($this->service->find($id, $this->with));
    }

    /**
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $this->service->delete($id);

        return $this->success($this->messageSuccessDefault);
    }

    /**
     * @param  null  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function preRequisite($id = null)
    {
        $preRequisite = $this->service->preRequisite($id);

        return $this->ok(compact('preRequisite'));
    }

    /**
     * @return \Illuminate\Http\JsonResponse
     */
    public function toSelect()
    {
        return $this->ok($this->service->toSelect());
    }
}
