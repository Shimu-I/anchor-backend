<?php
session_start();
require_once '../php/db_conn.php';

header('Content-Type: application/json');

$loan_id = $_GET['loan_id'] ?? 0;

if (empty($loan_id)) {
    echo json_encode(['success' => false, 'error' => 'Loan ID is required']);
    exit();
}

try {
    $sql = "SELECT 
                lr.loan_id,
                lr.borrower_id,
                lr.amount,
                lr.category,
                lr.custom_category,
                u.full_name as borrower_name
            FROM loan_requests lr
            INNER JOIN users u ON lr.borrower_id = u.user_id
            WHERE lr.loan_id = :loan_id";

    $stmt = $conn->prepare($sql);
    $stmt->execute([':loan_id' => $loan_id]);
    $loan = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($loan) {
        $category = $loan['custom_category'] ?: $loan['category'];

        echo json_encode([
            'success' => true,
            'loan_id' => $loan['loan_id'],
            'borrower_id' => $loan['borrower_id'],
            'borrower_name' => $loan['borrower_name'],
            'amount' => $loan['amount'],
            'category' => $category
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Loan not found']);
    }
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
