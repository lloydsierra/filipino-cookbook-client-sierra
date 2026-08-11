<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;

/*
|--------------------------------------------------------------------------
| Public Home Route
|--------------------------------------------------------------------------
|
| GET /
|
| This is the public welcome endpoint. A Bearer token is not required.
|
*/

return function (App $app): void {

    $app->get(
        '/',
        function (
            Request $request,
            Response $response
        ): Response {

            $response->getBody()->write(
                json_encode([
                    "message" =>
                        "Welcome to the Secured Filipino Cookbook API",

                    "note" =>
                        "Use a valid Bearer token to access /api endpoints."
                ])
            );

            return $response->withHeader(
                'Content-Type',
                'application/json'
            );
        }
    );
};