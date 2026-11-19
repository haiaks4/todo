<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'user_id'     => User::factory(),
            'tag_id'      => null,
            'title'       => fake()->realText(20),
            'description' => fake()->optional()->realText(100),
            'due_date'    => fake()->optional()->dateTimeBetween('now', '+1 month'),
            'priority'    => fake()->optional()->randomElement(['high', 'medium', 'low']),
            'status'      => 'todo',
            'order'       => 0,
        ];
    }
}
