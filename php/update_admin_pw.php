<?php
// Quick script to update admin password to '123admin'
require_once 'db_conn.php';

try {
    $new_password_hash = '$2y$10$wVgcIv8r58kOqHPfkhuyl.v7yq4SvV68PhYHyypvu1VucUwx.PhpG';

    $sql = "UPDATE users SET password_hash = :hash WHERE email = 'admin@lendora.com'";
    $stmt = $conn->prepare($sql);
    $stmt->execute([':hash' => $new_password_hash]);

    echo "✓ Admin password successfully updated to '123admin'\n";
    echo "\nYou can now login with:\n";
    echo "Email: admin@lendora.com\n";
    echo "Password: 123admin\n";
} catch (PDOException $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
