<?php
$servername = "localhost:55000";
$username = "root";
$password = "";
$dbname = "db_1";

try {

    $dsn = "mysql:host=$servername;dbname=$dbname;charset=utf8mb4";

    $conn = new PDO($dsn, $username, $password);

    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // echo "Database is connected! ✓\n";
} catch (PDOException $e) {

    die("Connection failed: " . $e->getMessage());
}
