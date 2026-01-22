<?php
session_start();
include 'db_conn.php';

if (isset($_POST['admin_login_btn'])) {

    // 1. Get Data from Form
    $email = trim($_POST['email']);
    $password = $_POST['password'];

    // 2. Validate Empty Fields
    if (empty($email) || empty($password)) {
        echo "<script>alert('Please fill in all fields'); window.location='admin-login.html';</script>";
        exit();
    }

    try {
        // 3. Check Database for User
        $stmt = $conn->prepare("SELECT user_id, full_name, password_hash, role FROM users WHERE email = :email");
        $stmt->execute([':email' => $email]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // 4. Verify User Exists AND Password is Correct
        if ($user && password_verify($password, $user['password_hash'])) {

            // Only allow admin login
            if ($user['role'] !== 'admin') {
                echo "<script>alert('Only administrators can access this page. Please use the regular login.'); window.location='login.html';</script>";
                exit();
            }

            // --- SUCCESS: LOG IN ADMIN ---
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['full_name'] = $user['full_name'];

            // 5. Redirect to Admin Dashboard
            echo "<script>
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userName', '" . addslashes($user['full_name']) . "');
                localStorage.setItem('userRole', 'admin');
                window.location.href = 'admin-dashboard.html';
            </script>";
            exit();
        } else {
            // --- FAILURE: Wrong Email or Password ---
            echo "<script>alert('Invalid Email or Password'); window.location='admin-login.html';</script>";
            exit();
        }
    } catch (PDOException $e) {
        echo "Database Error: " . $e->getMessage();
    }
} else {
    header("Location: admin-login.html");
    exit();
}
