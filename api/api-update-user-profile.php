<?php
session_start();
require_once '../php/db_conn.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Not logged in'
    ]);
    exit;
}

try {
    $user_id = $_SESSION['user_id'];

    // Get POST data
    $full_name = $_POST['full_name'] ?? '';
    $email = $_POST['email'] ?? '';
    $student_id = $_POST['student_id'] ?? '';
    $university = $_POST['university'] ?? '';

    // Validate required fields
    if (empty($full_name) || empty($email)) {
        echo json_encode([
            'success' => false,
            'error' => 'Full name and email are required'
        ]);
        exit;
    }

    // Check if email is already taken by another user
    $checkEmailQuery = "SELECT user_id FROM users WHERE email = :email AND user_id != :user_id";
    $stmt = $conn->prepare($checkEmailQuery);
    $stmt->execute([
        ':email' => $email,
        ':user_id' => $user_id
    ]);

    if ($stmt->fetch()) {
        echo json_encode([
            'success' => false,
            'error' => 'Email is already taken by another user'
        ]);
        exit;
    }

    // Update user profile
    $updateQuery = "UPDATE users 
                    SET full_name = :full_name,
                        email = :email,
                        student_id = :student_id,
                        university = :university
                    WHERE user_id = :user_id";

    $stmt = $conn->prepare($updateQuery);
    $result = $stmt->execute([
        ':full_name' => $full_name,
        ':email' => $email,
        ':student_id' => $student_id,
        ':university' => $university,
        ':user_id' => $user_id
    ]);

    if ($result) {
        // Update session username if full_name changed
        $_SESSION['full_name'] = $full_name;

        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to update profile'
        ]);
    }
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
