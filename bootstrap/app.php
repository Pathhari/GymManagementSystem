<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\MultiGuardMiddleware;  // Import the multi-guard class

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Here you alias or register your custom middlewares
        $middleware->alias('multiGuard', MultiGuardMiddleware::class);

        // If you had other middleware aliases:
        // $middleware->alias('role', CheckRole::class);
        // $middleware->alias('authStaff', StaffGuardMiddleware::class);
        // etc.
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();
