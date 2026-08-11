<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;

/*
|--------------------------------------------------------------------------
| Category Routes
|--------------------------------------------------------------------------
|
| GET /api/categories
|
| Returns all food categories.
|
*/

return function (
    App $app,
    PDO $pdo,
    callable $tokenMiddleware
): void {

    $app->get(
        '/api/categories',
        function (
            Request $request,
            Response $response
        ) use ($pdo): Response {

            $stmt = $pdo->query(
                "SELECT * FROM categories"
            );

            $categories = $stmt->fetchAll(
                PDO::FETCH_ASSOC
            );

            $response->getBody()->write(
                json_encode($categories)
            );

            return $response->withHeader(
                'Content-Type',
                'application/json'
            );
        }
    )->add($tokenMiddleware);
};