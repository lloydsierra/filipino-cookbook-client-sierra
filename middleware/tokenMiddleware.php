<?php

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;

$config = require __DIR__ . '/../config/config.php';

$accessToken = $config['authentication']['token'];

return function (
    Request $request,
    RequestHandlerInterface $handler
) use ($accessToken): ResponseInterface {

    $authHeader = $request->getHeaderLine(
        'Authorization'
    );

    $validToken = 'Bearer ' . $accessToken;

    if ($authHeader !== $validToken) {
        $response = new Response();

        $response->getBody()->write(
            json_encode([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ])
        );

        return $response
            ->withStatus(401)
            ->withHeader(
                'Content-Type',
                'application/json'
            );
    }

    return $handler->handle($request);
};