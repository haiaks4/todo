<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 繰り返しの間隔（daily / weekdays / weekly / monthly / yearly）。null は繰り返さない
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('recurrence', 20)->nullable()->after('due_date');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('recurrence');
        });
    }
};
