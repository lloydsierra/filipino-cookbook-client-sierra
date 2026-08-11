<?php

/*
|--------------------------------------------------------------------------
| Composer Autoloader
|--------------------------------------------------------------------------
*/

require __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;


/*
|--------------------------------------------------------------------------
| Create Slim Application
|--------------------------------------------------------------------------
*/

$app = AppFactory::create();
$app->setBasePath('/devera-client/public/index.php');


/*
|--------------------------------------------------------------------------
| Application Middleware
|--------------------------------------------------------------------------
*/

$app->addBodyParsingMiddleware();

$app->addErrorMiddleware(
    true,
    true,
    true
);

/*
|--------------------------------------------------------------------------
| CORS Middleware
|--------------------------------------------------------------------------
|
| Lets the static frontend client call this API from any origin, and
| answers preflight OPTIONS requests directly (browsers send these
| automatically before PUT/DELETE calls and calls with custom headers).
|
*/

$corsMiddleware = require __DIR__ . '/../middleware/corsMiddleware.php';
$app->add($corsMiddleware);

$app->options('/{routes:.+}', function ($request, $response) {
    return $response;
});


/*
|--------------------------------------------------------------------------
| Load Database Connection
|--------------------------------------------------------------------------
*/

$pdo = require __DIR__ . '/../config/database.php';


/*
|--------------------------------------------------------------------------
| Load Authentication Middleware
|--------------------------------------------------------------------------
*/

$tokenMiddleware = require __DIR__ .
    '/../middleware/tokenMiddleware.php';


/*
|--------------------------------------------------------------------------
| Load Route Files
|--------------------------------------------------------------------------
*/

$homeRoutes = require __DIR__ . '/../routes/homeRoutes.php';
$foodRoutes = require __DIR__ . '/../routes/foodRoutes.php';
$categoryRoutes = require __DIR__ . '/../routes/categoryRoutes.php';
$ingredientRoutes = require __DIR__ . '/../routes/ingredientRoutes.php';


/*
|--------------------------------------------------------------------------
| Register Routes
|--------------------------------------------------------------------------
*/

$homeRoutes($app);

$foodRoutes(
    $app,
    $pdo,
    $tokenMiddleware
);

$categoryRoutes(
    $app,
    $pdo,
    $tokenMiddleware
);

$ingredientRoutes(
    $app,
    $pdo,
    $tokenMiddleware
);

$app->run();