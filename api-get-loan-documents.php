<?php
session_start();
require_once 'db_conn.php';

header('Content-Type: application/json');

// Check if admin is logged in
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'error' => 'Unauthorized access']);
    exit();
}

$loan_id = $_GET['loan_id'] ?? 0;

if (empty($loan_id)) {
    echo json_encode(['success' => false, 'error' => 'Loan ID is required']);
    exit();
}

try {
    $sql = "SELECT 
                ld.doc_id,
                ld.doc_type,
                ld.file_path,
                ld.file_name,
                ld.file_size,
                ld.mime_type,
                ld.verified,
                ld.uploaded_at
            FROM loan_documents ld
            WHERE ld.loan_id = :loan_id
            ORDER BY ld.uploaded_at DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute([':loan_id' => $loan_id]);
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
