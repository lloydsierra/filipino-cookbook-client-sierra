<?php

$config = require __DIR__ . '/config.php';

$dbHost = $config['database']['host'];
$dbName = $config['database']['name'];
$dbUser = $config['database']['username'];
$dbPass = $config['database']['password'];

try {
    $pdo = new PDO(
        "mysql:host={$dbHost};dbname={$dbName}",
        $dbUser,
        $dbPass
    );

    $pdo->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

    return $pdo;

} catch (PDOException $e) {
    die(
        "Unable to connect to the database. " .
        "Check the local configuration."
    );
}