<?php
// Test script to verify admin login credentials
include 'db_conn.php';

echo "<h2>Admin Login Test</h2>";

try {
    // Check if admin user exists
    $stmt = $conn->prepare("SELECT user_id, username, email, password_hash, role FROM users WHERE email = 'admin@lendora.com'");
    $stmt->execute();
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($admin) {
        echo "<p style='color:green;'>✓ Admin user found!</p>";
        echo "<pre>";
        echo "User ID: " . $admin['user_id'] . "\n";
        echo "Username: " . $admin['username'] . "\n";
        echo "Email: " . $admin['email'] . "\n";
        echo "Role: " . $admin['role'] . "\n";
        echo "Password Hash: " . substr($admin['password_hash'], 0, 30) . "...\n";
        echo "</pre>";

        // Test password verification
        $test_password = '123admin';
        if (password_verify($test_password, $admin['password_hash'])) {
            echo "<p style='color:green; font-weight:bold;'>✓ Password '123admin' is CORRECT!</p>";
        } else {
            echo "<p style='color:red; font-weight:bold;'>✗ Password '123admin' does NOT match!</p>";
            echo "<p>You need to run the SQL update script:</p>";
            echo "<pre>UPDATE users SET password_hash = '\$2y\$10\$wVgcIv8r58kOqHPfkhuyl.v7yq4SvV68PhYHyypvu1VucUwx.PhpG' WHERE email = 'admin@lendora.com';</pre>";
        }
    } else {
        echo "<p style='color:red;'>✗ Admin user NOT found!</p>";
        echo "<p>You need to create an admin user in the database.</p>";
    }
} catch (PDOException $e) {
    echo "<p style='color:red;'>Database Error: " . $e->getMessage() . "</p>";
}
