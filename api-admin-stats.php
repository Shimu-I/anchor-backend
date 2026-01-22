<?php
session_start();
include 'db_conn.php';

// Check if admin is logged in
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

try {
    // Get total users
    $users_stmt = $conn->query("SELECT COUNT(*) as total FROM users");
    $total_users = $users_stmt->fetchColumn();
    
    // Get active loan requests (pending + approved)
    $loans_stmt = $conn->query("SELECT COUNT(*) as total FROM loan_requests WHERE status IN ('pending', 'approved')");
    $active_loans = $loans_stmt->fetchColumn();
    
    // Get active fundraisers (pending + approved + open)
    $funding_stmt = $conn->query("SELECT COUNT(*) as total FROM crowdfunding_posts WHERE status IN ('pending', 'approved', 'open')");
    $active_funding = $funding_stmt->fetchColumn();
    
    // Get pending loan requests
    $pending_loans_stmt = $conn->query("SELECT COUNT(*) as total FROM loan_requests WHERE status = 'pending'");
    $pending_loans = $pending_loans_stmt->fetchColumn();
    
    // Get pending fundraisers
    $pending_funding_stmt = $conn->query("SELECT COUNT(*) as total FROM crowdfunding_posts WHERE status = 'pending'");
    $pending_funding = $pending_funding_stmt->fetchColumn();
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_users' => $total_users,
            'active_loans' => $active_loans,
            'active_funding' => $active_funding,
            'pending_loans' => $pending_loans,
            'pending_funding' => $pending_funding
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
