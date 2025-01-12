<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MultiGuardMiddleware
{
    /**
     * Example usage in routes:
     * ->middleware('multiGuard:owner,admin,staff')
     */
    public function handle(Request $request, Closure $next, ...$guards)
    {
        foreach ($guards as $guard) {
            // If this user is authenticated with one of these guards, allow
            if (Auth::guard($guard)->check()) {
                return $next($request);
            }
        }

        // If no guard matched, reject
        abort(403, 'Unauthorized. None of the specified guards are logged in.');
    }
}
