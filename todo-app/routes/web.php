<?php

use App\Http\Controllers\ProfileController;
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
    $user = auth()->user();
    $tasks = $user->tasks();

    $stats = [
        'total'       => $tasks->count(),
        'todo'        => (clone $tasks)->where('status', 'todo')->count(),
        'in_progress' => (clone $tasks)->where('status', 'in_progress')->count(),
        'done'        => (clone $tasks)->where('status', 'done')->count(),
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

    // Task API
    Route::get('/api/tasks', [TaskController::class, 'list'])->name('task.list');
    Route::post('/api/tasks', [TaskController::class, 'store'])->name('task.store');
    Route::get('/api/tasks/{task}', [TaskController::class, 'show'])->name('task.show');
    Route::patch('/api/tasks/{task}', [TaskController::class, 'update'])->name('task.update');
    Route::delete('/api/tasks/{task}', [TaskController::class, 'destroy'])->name('task.destroy');
    Route::post('/api/tasks/{task}/duplicate', [TaskController::class, 'duplicate'])->name('task.duplicate');
    Route::post('/api/tasks/bulk-delete', [TaskController::class, 'bulkDestroy'])->name('task.bulk-destroy');
    Route::post('/api/tasks/reorder', [TaskController::class, 'reorder'])->name('task.reorder');

    // Tag API
    Route::get('/api/tags', [TagController::class, 'index'])->name('tag.index');
    Route::post('/api/tags', [TagController::class, 'store'])->name('tag.store');
    Route::patch('/api/tags/{tag}', [TagController::class, 'update'])->name('tag.update');
    Route::delete('/api/tags/{tag}', [TagController::class, 'destroy'])->name('tag.destroy');
});

require __DIR__.'/auth.php';
