<?php
session_start();
require_once 'db_conn.php';

header('Content-Type: application/json');

// Check if admin is logged in
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'error' => 'Unauthorized access']);
    exit();
}

$post_id = $_GET['post_id'] ?? 0;

if (empty($post_id)) {
    echo json_encode(['success' => false, 'error' => 'Post ID is required']);
    exit();
}

try {
    $sql = "SELECT 
                fd.doc_id,
                fd.doc_type,
                fd.file_path,
                fd.file_name,
                fd.file_size,
                fd.mime_type,
                fd.verified,
                fd.uploaded_at
            FROM funding_documents fd
            WHERE fd.post_id = :post_id
            ORDER BY fd.uploaded_at DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute([':post_id' => $post_id]);
    $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'documents' => $documents,
        'count' => count($documents)
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
