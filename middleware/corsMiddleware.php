<?php

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface;

/*
|--------------------------------------------------------------------------
| CORS Middleware
|--------------------------------------------------------------------------
|
| Allows the static frontend client (served from any host — a local dev
| server, GitHub Pages, etc.) to call this API. Also short-circuits
| preflight OPTIONS requests, which browsers send automatically before
| PUT/DELETE/POST calls that carry custom headers like Authorization.
|
*/

return function (
    Request $request,
    RequestHandlerInterface $handler
): ResponseInterface {

    $response = $handler->handle($request);

    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
};
