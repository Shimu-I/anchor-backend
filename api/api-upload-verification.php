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

    // Check if file was uploaded
    if (!isset($_FILES['verification_document']) || $_FILES['verification_document']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode([
            'success' => false,
            'error' => 'No file uploaded or upload error'
        ]);
        exit;
    }

    $file = $_FILES['verification_document'];

    // Validate file type
    $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    $file_type = mime_content_type($file['tmp_name']);

    if (!in_array($file_type, $allowed_types)) {
        echo json_encode([
            'success' => false,
            'error' => 'Invalid file type. Only JPG, PNG, and GIF images are allowed'
        ]);
        exit;
    }

    // Validate file size (5MB max)
    if ($file['size'] > 5 * 1024 * 1024) {
        echo json_encode([
            'success' => false,
            'error' => 'File size exceeds 5MB limit'
        ]);
        exit;
    }

    // Create upload directory if it doesn't exist
    $upload_dir = 'images/uploads/verification/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'verification_' . $user_id . '_' . time() . '.' . $extension;
    $filepath = $upload_dir . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to save uploaded file'
        ]);
        exit;
    }

    // Check if user already has a verification document
    $checkQuery = "SELECT doc_id FROM verification_documents WHERE user_id = :user_id";
    $stmt = $conn->prepare($checkQuery);
    $stmt->execute([':user_id' => $user_id]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        // Update existing document
        $updateQuery = "UPDATE verification_documents 
                       SET file_path = :file_path,
                           file_name = :file_name,
                           uploaded_at = CURRENT_TIMESTAMP,
                           verified = 0
                       WHERE user_id = :user_id";

        $stmt = $conn->prepare($updateQuery);
        $stmt->execute([
            ':file_path' => $filepath,
            ':file_name' => $filename,
            ':user_id' => $user_id
        ]);
    } else {
        // Insert new document
        $insertQuery = "INSERT INTO verification_documents 
                       (user_id, file_path, file_name, uploaded_at, verified) 
                       VALUES (:user_id, :file_path, :file_name, CURRENT_TIMESTAMP, 0)";

        $stmt = $conn->prepare($insertQuery);
        $stmt->execute([
            ':user_id' => $user_id,
            ':file_path' => $filepath,
            ':file_name' => $filename
        ]);
    }

    // Update user verification status to pending
    $updateUserQuery = "UPDATE users 
                       SET verification_status = 'pending' 
                       WHERE user_id = :user_id";

    $stmt = $conn->prepare($updateUserQuery);
    $stmt->execute([':user_id' => $user_id]);

    echo json_encode([
        'success' => true,
        'message' => 'Verification document uploaded successfully',
        'filename' => $filename
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
