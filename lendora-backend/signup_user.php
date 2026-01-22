<?php
session_start();

// 1. Connect to Database
// (Make sure this path points correctly to your includes folder)
include '../anchor-backend/db_conn.php';

if (isset($_POST['signup_btn'])) {

    // 2. Collect the data using the 'names' we added to HTML
    $full_name = $_POST['full_name'];
    $email     = $_POST['email'];
    $password  = $_POST['password'];

    // 3. Hash the password (Security Best Practice)
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    try {
        // 4. Prepare SQL to insert into your 'users' table
        $sql = "INSERT INTO users (full_name, email, password) VALUES (:name, :email, :pass)";
        $stmt = $conn->prepare($sql);

        // 5. Execute the insert
        $stmt->execute([
            ':name'  => $full_name,
            ':email' => $email,
            ':pass'  => $hashed_password
        ]);

        // 6. Success: Redirect to Login page
        $_SESSION['message'] = "Account created successfully! Please log in.";
        header("Location: ../login.html");
        exit();
    } catch (PDOException $e) {
        // 7. Handle "Duplicate Email" error (Code 23000)
        if ($e->getCode() == 23000) {
            $_SESSION['message'] = "This email is already registered.";
            header("Location: ../signup.php");
            exit();
        } else {
            die("Database Error: " . $e->getMessage());
        }
    }
} else {
    // If someone tries to open this file directly, kick them out
    header("Location: ../signup.php");
    exit();
}
