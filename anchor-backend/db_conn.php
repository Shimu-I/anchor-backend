<?php
$servername = "localhost:55000";
$username = "root";
$password = "";
$dbname = "funding_app";

try {
    // 1. Create the PDO connection (The "DSN" string)
    $dsn = "mysql:host=$servername;dbname=$dbname;charset=utf8mb4";

    $conn = new PDO($dsn, $username, $password);

    // 2. Set Error Mode to Exception
    // This forces PHP to throw a visible error if SQL fails (essential for debugging)
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 3. Set Default Fetch Mode to Associative Array
    // This means data comes back as ["name" => "John"] instead of [0 => "John"]
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // echo "Connected successfully"; // Keep commented out for production
    echo "Database is connected! ✓\n";
} catch (PDOException $e) {
    // If connection fails, show why
    die("Connection failed: " . $e->getMessage());
}
