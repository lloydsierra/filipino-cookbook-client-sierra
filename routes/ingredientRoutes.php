<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;

/*
|--------------------------------------------------------------------------
| Ingredient Routes
|--------------------------------------------------------------------------
|
| GET /api/ingredients
|
| Returns all ingredients.
|
*/

return function (
    App $app,
    PDO $pdo,
    callable $tokenMiddleware
): void {

    $app->get(
        '/api/ingredients',
        function (
            Request $request,
            Response $response
        ) use ($pdo): Response {

            $stmt = $pdo->query(
                "SELECT * FROM ingredients"
            );

            $ingredients = $stmt->fetchAll(
                PDO::FETCH_ASSOC
            );

            $response->getBody()->write(
                json_encode($ingredients)
            );

            return $response->withHeader(
                'Content-Type',
                'application/json'
            );
        }
    )->add($tokenMiddleware);
};