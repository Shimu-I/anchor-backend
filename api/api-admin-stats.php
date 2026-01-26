<?php
session_start();
include '../php/db_conn.php';

// Check if admin is logged in
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

try {
    // Get total users (excluding admin)
    $users_stmt = $conn->query("SELECT COUNT(*) FROM users WHERE role != 'admin'");
    $total_users = $users_stmt->fetchColumn();

    // Get total loan requests
    $total_loans_stmt = $conn->query("SELECT COUNT(*) FROM loan_requests");
    $total_loans = $total_loans_stmt->fetchColumn();

    // Get total fundraising posts
    $total_funding_stmt = $conn->query("SELECT COUNT(*) FROM crowdfunding_posts");
    $total_funding = $total_funding_stmt->fetchColumn();

    // Get total amount disbursed (approved loans)
    $disbursed_stmt = $conn->query("SELECT COALESCE(SUM(amount), 0) FROM loan_requests WHERE status = 'approved'");
    $total_disbursed = $disbursed_stmt->fetchColumn();

    // Get pending loan requests
    $pending_loans_stmt = $conn->query("SELECT COUNT(*) FROM loan_requests WHERE status = 'pending'");
    $pending_loans = $pending_loans_stmt->fetchColumn();

    // Get pending fundraisers
    $pending_funding_stmt = $conn->query("SELECT COUNT(*) FROM crowdfunding_posts WHERE status = 'pending'");
    $pending_funding = $pending_funding_stmt->fetchColumn();

    // Get approved loans
    $approved_loans_stmt = $conn->query("SELECT COUNT(*) FROM loan_requests WHERE status = 'approved'");
    $approved_loans = $approved_loans_stmt->fetchColumn();

    // Get active fundraisers (approved or open)
    $active_funding_stmt = $conn->query("SELECT COUNT(*) FROM crowdfunding_posts WHERE status IN ('approved', 'open')");
    $active_funding = $active_funding_stmt->fetchColumn();

    // Get total contributions (loan + crowdfunding)
    $loan_contributions_stmt = $conn->query("SELECT COUNT(*) FROM loan_contributions");
    $crowdfunding_contributions_stmt = $conn->query("SELECT COUNT(*) FROM crowdfunding_contributions");
    $total_contributions = $loan_contributions_stmt->fetchColumn() + $crowdfunding_contributions_stmt->fetchColumn();

    // Get verified users (users with uploaded documents)
    $verified_users_stmt = $conn->query("SELECT COUNT(DISTINCT user_id) FROM user_documents");
    $verified_users = $verified_users_stmt->fetchColumn();

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_users' => (int)$total_users,
            'total_loans' => (int)$total_loans,
            'total_funding' => (int)$total_funding,
            'total_disbursed' => (float)$total_disbursed,
            'pending_loans' => (int)$pending_loans,
            'pending_funding' => (int)$pending_funding,
            'approved_loans' => (int)$approved_loans,
            'active_funding' => (int)$active_funding,
            'total_contributions' => (int)$total_contributions,
            'verified_users' => (int)$verified_users
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
