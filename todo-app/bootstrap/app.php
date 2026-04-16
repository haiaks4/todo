<?php

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {

        // 404: モデルが見つからない
        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(
                    ['message' => __('errors.not_found')],
                    404
                );
            }
        });

        // 403: 認可エラー
        $exceptions->render(function (AuthorizationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(
                    ['message' => __('errors.forbidden')],
                    403
                );
            }
        });

        // 401: 未認証
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(
                    ['message' => __('errors.unauthenticated')],
                    401
                );
            }
        });

        // その他のHTTPエラー（404,405など）およびサーバーエラー
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            $status = $e instanceof HttpException ? $e->getStatusCode() : 500;

            // 本番環境ではエラー詳細を隠す
            $message = ($status === 500 && app()->environment('production'))
                ? __('errors.server_error')
                : $e->getMessage();

            return response()->json(['message' => $message], $status);
        });

    })->create();
