<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApiSetting extends Model
{
    protected $fillable = [
        'name',
        'encrypted_value',
    ];

    protected $casts = [
        'encrypted_value' => 'encrypted',
    ];

    public static function getValue(string $name): ?string
    {
        $setting = self::query()->where('name', $name)->first();

        if (! $setting) {
            return null;
        }

        return (string) $setting->encrypted_value;
    }

    public static function putValue(string $name, ?string $value): void
    {
        if (blank($value)) {
            return;
        }

        self::query()->updateOrCreate(
            ['name' => $name],
            ['encrypted_value' => $value]
        );
    }
}
