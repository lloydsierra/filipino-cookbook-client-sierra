<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;

/*
|--------------------------------------------------------------------------
| Food Routes
|--------------------------------------------------------------------------
|
| This file contains all endpoints related to food records.
|
*/

return function (
    App $app,
    PDO $pdo,
    callable $tokenMiddleware
): void {

    /*
    |--------------------------------------------------------------------------
    | GET /api/foods
    |--------------------------------------------------------------------------
    |
    | Returns all food records together with their ingredients.
    |
    */

    $app->get(
        '/api/foods',
        function (
            Request $request,
            Response $response
        ) use ($pdo): Response {

            $stmt = $pdo->query("
                SELECT *
                FROM foods
            ");

            $foods = $stmt->fetchAll(
                PDO::FETCH_ASSOC
            );

            foreach ($foods as &$food) {
                $stmtIngredients = $pdo->prepare("
                    SELECT i.ingredient_name
                    FROM ingredients i
                    INNER JOIN food_ingredients fi
                        ON i.ingredient_id = fi.ingredient_id
                    WHERE fi.food_id = ?
                ");

                $stmtIngredients->execute([
                    $food['food_id']
                ]);

                $food['ingredients'] =
                    $stmtIngredients->fetchAll(
                        PDO::FETCH_COLUMN
                    );
            }

            unset($food);

            $response->getBody()->write(
                json_encode($foods)
            );

            return $response->withHeader(
                'Content-Type',
                'application/json'
            );
        }
    )->add($tokenMiddleware);


    /*
    |--------------------------------------------------------------------------
    | GET /api/foods/random
    |--------------------------------------------------------------------------
    |
    | Returns one randomly selected food and its ingredients.
    |
    */

    $app->get(
        '/api/foods/random',
        function (
            Request $request,
            Response $response
        ) use ($pdo): Response {

            $stmt = $pdo->query("
                SELECT *
                FROM foods
                ORDER BY RAND()
                LIMIT 1
            ");

            $food = $stmt->fetch(
                PDO::FETCH_ASSOC
            );

            $stmt = $pdo->prepare("
                SELECT ingredient_name
                FROM ingredients
                INNER JOIN food_ingredients
                    ON ingredients.ingredient_id =
                       food_ingredients.ingredient_id
                WHERE food_ingredients.food_id = ?
            ");

            $stmt->execute([
                $food['food_id']
            ]);

            $food['ingredients'] =
                $stmt->fetchAll(
                    PDO::FETCH_COLUMN
                );

            $response->getBody()->write(
                json_encode($food)
            );

            return $response->withHeader(
                'Content-Type',
                'application/json'
            );
        }
    )->add($tokenMiddleware);


    /*
    |--------------------------------------------------------------------------
    | GET /api/foods/search/{name}
    |--------------------------------------------------------------------------
    |
    | Searches for food records using a partial food name.
    |
    | Example:
    | GET /api/foods/search/adobo
    |
    */

    $app->get(
        '/api/foods/search/{name}',
        function (
            Request $request,
            Response $response,
            array $args
        ) use ($pdo): Response {

            $stmt = $pdo->prepare("
                SELECT *
                FROM foods
                WHERE food_name LIKE ?
            ");

            $stmt->execute([
                "%" . $args['name'] . "%"
            ]);

            $foods = $stmt->fetchAll(
                PDO::FETCH_ASSOC
            );

            $response->getBody()->write(
                json_encode($foods)
            );

            return $response->withHeader(
                'Content-Type',
                'application/json'
            );
        }
    )->add($tokenMiddleware);


    /*
    |--------------------------------------------------------------------------
    | GET /api/foods/{id}
    |--------------------------------------------------------------------------
    |
    | Returns one food record based on its food ID.
    |
    | Example:
    | GET /api/foods/2
    |
    */

    $app->get(
        '/api/foods/{id}',
        function (
            Request $request,
            Response $response,
            array $args
        ) use ($pdo): Response {

            $foodId = $args['id'];

            $stmt = $pdo->prepare("
                SELECT *
                FROM foods
                WHERE food_id = ?
            ");

            $stmt->execute([
                $foodId
            ]);

            $food = $stmt->fetch(
                PDO::FETCH_ASSOC
            );

            if (!$food) {
                $response->getBody()->write(
                    json_encode([
                        "message" => "Food not found"
                    ])
                );

                return $response
                    ->withStatus(404)
                    ->withHeader(
                        'Content-Type',
                        'application/json'
                    );
            }

            $stmt = $pdo->prepare("
                SELECT i.ingredient_name
                FROM ingredients i
                INNER JOIN food_ingredients fi
                    ON i.ingredient_id = fi.ingredient_id
                WHERE fi.food_id = ?
            ");

            $stmt->execute([
                $foodId
            ]);

            $food['ingredients'] =
                $stmt->fetchAll(
                    PDO::FETCH_COLUMN
                );

            $response->getBody()->write(
                json_encode($food)
            );

            return $response->withHeader(
                'Content-Type',
                'application/json'
            );
        }
    )->add($tokenMiddleware);


    /*
    |--------------------------------------------------------------------------
    | POST /api/foods
    |--------------------------------------------------------------------------
    |
    | Creates a new food record and connects its ingredients.
    |
    | Expected JSON body:
    |
    | {
    |     "food_name": "Chicken Adobo",
    |     "category_id": 1,
    |     "origin_id": 1,
    |     "instructions": "Cook the ingredients.",
    |     "ingredients": [
    |         "Chicken",
    |         "Soy Sauce",
    |         "Vinegar"
    |     ]
    | }
    |
    */

    $app->post(
        '/api/foods',
        function (
            Request $request,
            Response $response
        ) use ($pdo): Response {

            $data = $request->getParsedBody();

            try {
                $pdo->beginTransaction();

                /*
                |--------------------------------------------------------------------------
                | Insert Food
                |--------------------------------------------------------------------------
                */

                $stmt = $pdo->prepare("
                    INSERT INTO foods
                    (
                        food_name,
                        category_id,
                        origin_id,
                        instructions
                    )
                    VALUES (?, ?, ?, ?)
                ");

                $stmt->execute([
                    $data['food_name'],
                    $data['category_id'],
                    $data['origin_id'],
                    $data['instructions']
                ]);

                $foodId = $pdo->lastInsertId();

                /*
                |--------------------------------------------------------------------------
                | Insert Ingredients
                |--------------------------------------------------------------------------
                */

                foreach (
                    $data['ingredients'] as $ingredientName
                ) {
                    $stmt = $pdo->prepare("
                        SELECT ingredient_id
                        FROM ingredients
                        WHERE ingredient_name = ?
                    ");

                    $stmt->execute([
                        $ingredientName
                    ]);

                    $ingredient = $stmt->fetch(
                        PDO::FETCH_ASSOC
                    );

                    /*
                    | If the ingredient does not exist,
                    | create a new ingredient record.
                    */

                    if (!$ingredient) {
                        $stmt = $pdo->prepare("
                            INSERT INTO ingredients
                            (
                                ingredient_name
                            )
                            VALUES (?)
                        ");

                        $stmt->execute([
                            $ingredientName
                        ]);

                        $ingredientId =
                            $pdo->lastInsertId();

                    } else {
                        $ingredientId =
                            $ingredient['ingredient_id'];
                    }

                    /*
                    | Connect the food and ingredient
                    | through the food_ingredients table.
                    */

                    $stmt = $pdo->prepare("
                        INSERT INTO food_ingredients
                        (
                            food_id,
                            ingredient_id
                        )
                        VALUES (?, ?)
                    ");

                    $stmt->execute([
                        $foodId,
                        $ingredientId
                    ]);
                }

                $pdo->commit();

                $response->getBody()->write(
                    json_encode([
                        "status" => "success",
                        "message" =>
                            "Food added successfully",
                        "food_id" => $foodId
                    ])
                );

                return $response
                    ->withStatus(201)
                    ->withHeader(
                        'Content-Type',
                        'application/json'
                    );

            } catch (Exception $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }

                $response->getBody()->write(
                    json_encode([
                        "status" => "error",
                        "message" => $e->getMessage()
                    ])
                );

                return $response
                    ->withStatus(500)
                    ->withHeader(
                        'Content-Type',
                        'application/json'
                    );
            }
        }
    )->add($tokenMiddleware);


    /*
    |--------------------------------------------------------------------------
    | PUT /api/foods/{id}
    |--------------------------------------------------------------------------
    |
    | Updates an existing food record and replaces its ingredient
    | relationships.
    |
    */

    $app->put(
        '/api/foods/{id}',
        function (
            Request $request,
            Response $response,
            array $args
        ) use ($pdo): Response {

            $foodId = $args['id'];
            $data = $request->getParsedBody();

            try {
                $pdo->beginTransaction();

                /*
                |--------------------------------------------------------------------------
                | Update Food
                |--------------------------------------------------------------------------
                */

                $stmt = $pdo->prepare("
                    UPDATE foods
                    SET
                        food_name = ?,
                        category_id = ?,
                        origin_id = ?,
                        instructions = ?
                    WHERE food_id = ?
                ");

                $stmt->execute([
                    $data['food_name'],
                    $data['category_id'],
                    $data['origin_id'],
                    $data['instructions'],
                    $foodId
                ]);

                /*
                |--------------------------------------------------------------------------
                | Remove Previous Ingredient Relationships
                |--------------------------------------------------------------------------
                */

                $stmt = $pdo->prepare("
                    DELETE FROM food_ingredients
                    WHERE food_id = ?
                ");

                $stmt->execute([
                    $foodId
                ]);

                /*
                |--------------------------------------------------------------------------
                | Add Updated Ingredients
                |--------------------------------------------------------------------------
                */

                foreach (
                    $data['ingredients'] as $ingredientName
                ) {
                    $stmt = $pdo->prepare("
                        SELECT ingredient_id
                        FROM ingredients
                        WHERE ingredient_name = ?
                    ");

                    $stmt->execute([
                        $ingredientName
                    ]);

                    $ingredient = $stmt->fetch(
                        PDO::FETCH_ASSOC
                    );

                    if (!$ingredient) {
                        $stmt = $pdo->prepare("
                            INSERT INTO ingredients
                            (
                                ingredient_name
                            )
                            VALUES (?)
                        ");

                        $stmt->execute([
                            $ingredientName
                        ]);

                        $ingredientId =
                            $pdo->lastInsertId();

                    } else {
                        $ingredientId =
                            $ingredient['ingredient_id'];
                    }

                    $stmt = $pdo->prepare("
                        INSERT INTO food_ingredients
                        (
                            food_id,
                            ingredient_id
                        )
                        VALUES (?, ?)
                    ");

                    $stmt->execute([
                        $foodId,
                        $ingredientId
                    ]);
                }

                $pdo->commit();

                $response->getBody()->write(
                    json_encode([
                        "status" => "success",
                        "message" =>
                            "Food updated successfully."
                    ])
                );

                return $response->withHeader(
                    'Content-Type',
                    'application/json'
                );

            } catch (Exception $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }

                $response->getBody()->write(
                    json_encode([
                        "status" => "error",
                        "message" => $e->getMessage()
                    ])
                );

                return $response
                    ->withStatus(500)
                    ->withHeader(
                        'Content-Type',
                        'application/json'
                    );
            }
        }
    )->add($tokenMiddleware);


    /*
    |--------------------------------------------------------------------------
    | DELETE /api/foods/{id}
    |--------------------------------------------------------------------------
    |
    | Deletes the food-ingredient relationships before deleting
    | the selected food.
    |
    */

    $app->delete(
        '/api/foods/{id}',
        function (
            Request $request,
            Response $response,
            array $args
        ) use ($pdo): Response {

            $foodId = $args['id'];

            try {
                $pdo->beginTransaction();

                /*
                |--------------------------------------------------------------------------
                | Delete Food-Ingredient Relationships
                |--------------------------------------------------------------------------
                */

                $stmt = $pdo->prepare("
                    DELETE FROM food_ingredients
                    WHERE food_id = ?
                ");

                $stmt->execute([
                    $foodId
                ]);

                /*
                |--------------------------------------------------------------------------
                | Delete Food
                |--------------------------------------------------------------------------
                */

                $stmt = $pdo->prepare("
                    DELETE FROM foods
                    WHERE food_id = ?
                ");

                $stmt->execute([
                    $foodId
                ]);

                $pdo->commit();

                $response->getBody()->write(
                    json_encode([
                        "status" => "success",
                        "message" =>
                            "Food deleted successfully."
                    ])
                );

                return $response->withHeader(
                    'Content-Type',
                    'application/json'
                );

            } catch (Exception $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }

                $response->getBody()->write(
                    json_encode([
                        "status" => "error",
                        "message" => $e->getMessage()
                    ])
                );

                return $response
                    ->withStatus(500)
                    ->withHeader(
                        'Content-Type',
                        'application/json'
                    );
            }
        }
    )->add($tokenMiddleware);
};