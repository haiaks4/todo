<?php

namespace App\Http\Requests\Task;

/**
 * ごみ箱のタスクを完全に削除する。対象は「元に戻す」と同じく、本人の削除済みタスク。
 */
class ForceDeleteTaskRequest extends RestoreTaskRequest {}
