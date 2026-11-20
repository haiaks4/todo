<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\SubtaskController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
});

Route::get('/dashboard', function () {
    $counts = auth()->user()->tasks()
        ->selectRaw('status, COUNT(*) as aggregate')
        ->groupBy('status')
        ->pluck('aggregate', 'status');

    $stats = [
        'total'       => (int) $counts->sum(),
        'todo'        => (int) ($counts['todo'] ?? 0),
        'in_progress' => (int) ($counts['in_progress'] ?? 0),
        'done'        => (int) ($counts['done'] ?? 0),
    ];

    return Inertia::render('Dashboard', ['stats' => $stats]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/remind', [ProfileController::class, 'updateRemind'])->name('profile.remind');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Task page
    Route::get('/task', [TaskController::class, 'index'])->name('task.index');
    Route::get('/task/trash', [TaskController::class, 'trash'])->name('task.trash');

    // Task API
    // 静的なパスは {task} より先に定義する
    Route::post('/api/tasks/bulk-delete', [TaskController::class, 'bulkDestroy'])->name('task.bulk-destroy');
    Route::post('/api/tasks/restore', [TaskController::class, 'restore'])->name('task.restore');
    // ごみ箱（/api/tasks/{task} より前に定義する）
    Route::get('/api/tasks/trash', [TaskController::class, 'trashed'])->name('task.trashed');
    Route::delete('/api/tasks/trash', [TaskController::class, 'emptyTrash'])->name('task.empty-trash');
    Route::post('/api/tasks/force-delete', [TaskController::class, 'forceDelete'])->name('task.force-delete');
    Route::post('/api/tasks/bulk-status', [TaskController::class, 'bulkUpdateStatus'])->name('task.bulk-status');
    Route::post('/api/tasks/reorder', [TaskController::class, 'reorder'])->name('task.reorder');
    Route::get('/api/tasks', [TaskController::class, 'list'])->name('task.list');
    Route::post('/api/tasks', [TaskController::class, 'store'])->name('task.store');
    Route::get('/api/tasks/{task}', [TaskController::class, 'show'])->name('task.show');
    Route::patch('/api/tasks/{task}', [TaskController::class, 'update'])->name('task.update');
    Route::delete('/api/tasks/{task}', [TaskController::class, 'destroy'])->name('task.destroy');
    Route::post('/api/tasks/{task}/duplicate', [TaskController::class, 'duplicate'])->name('task.duplicate');
    Route::post('/api/tasks/{task}/subtasks', [SubtaskController::class, 'store'])->name('subtask.store');
    Route::patch('/api/subtasks/{subtask}', [SubtaskController::class, 'update'])->name('subtask.update');
    Route::delete('/api/subtasks/{subtask}', [SubtaskController::class, 'destroy'])->name('subtask.destroy');

    // Tag API
    Route::get('/api/projects', [ProjectController::class, 'index'])->name('project.index');
    Route::post('/api/projects', [ProjectController::class, 'store'])->name('project.store');
    Route::patch('/api/projects/{project}', [ProjectController::class, 'update'])->name('project.update');
    Route::delete('/api/projects/{project}', [ProjectController::class, 'destroy'])->name('project.destroy');

    Route::get('/api/tags', [TagController::class, 'index'])->name('tag.index');
    Route::post('/api/tags', [TagController::class, 'store'])->name('tag.store');
    Route::patch('/api/tags/{tag}', [TagController::class, 'update'])->name('tag.update');
    Route::delete('/api/tags/{tag}', [TagController::class, 'destroy'])->name('tag.destroy');
});

require __DIR__.'/auth.php';
