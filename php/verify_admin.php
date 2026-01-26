<?php
// Verify admin account
require 'db_conn.php';

echo "=== ADMIN ACCOUNT VERIFICATION ===\n\n";

$stmt = $conn->prepare('SELECT user_id, username, email, password_hash, role FROM users WHERE email = "admin@lendora.com"');
$stmt->execute();
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if ($admin) {
    echo "✓ Admin account found\n";
    echo "Email: " . $admin['email'] . "\n";
    echo "Username: " . $admin['username'] . "\n";
    echo "Role: " . $admin['role'] . "\n";
    echo "Hash: " . substr($admin['password_hash'], 0, 50) . "...\n\n";

    // Test password
    $test_password = '123admin';
    if (password_verify($test_password, $admin['password_hash'])) {
        echo "✓ Password '123admin' MATCHES!\n";
        echo "\nYou can login with:\n";
        echo "Email: admin@lendora.com\n";
        echo "Password: 123admin\n";
    } else {
        echo "✗ Password '123admin' DOES NOT MATCH\n";
        echo "The password hash in database doesn't match '123admin'\n";
        echo "\nUpdating password now...\n";

        $new_hash = '$2y$10$wVgcIv8r58kOqHPfkhuyl.v7yq4SvV68PhYHyypvu1VucUwx.PhpG';
        $update_stmt = $conn->prepare('UPDATE users SET password_hash = :hash WHERE email = "admin@lendora.com"');
        $update_stmt->execute([':hash' => $new_hash]);
        echo "✓ Password updated! Try logging in again.\n";
    }
} else {
    echo "✗ Admin account NOT FOUND in database!\n";
    echo "Creating admin account...\n";

    $insert_stmt = $conn->prepare('INSERT INTO users (username, email, password_hash, full_name, role, verification_status) VALUES (?, ?, ?, ?, ?, ?)');
    $insert_stmt->execute([
        'admin',
        'admin@lendora.com',
        '$2y$10$wVgcIv8r58kOqHPfkhuyl.v7yq4SvV68PhYHyypvu1VucUwx.PhpG',
        'Admin User',
        'admin',
        'verified'
    ]);
    echo "✓ Admin account created!\n";
}
