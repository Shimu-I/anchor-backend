<?php
session_start();
include 'db_conn.php';

// Check if admin is logged in
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$type = $_POST['type'] ?? ''; // 'loan' or 'funding'
$id = $_POST['id'] ?? 0;
$action = $_POST['action'] ?? ''; // 'approve' or 'reject'

if (empty($type) || empty($id) || empty($action)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required parameters']);
    exit();
}

try {
    $conn->beginTransaction();
    
    if ($type === 'loan') {
        // Update loan request status
        $new_status = ($action === 'approve') ? 'approved' : 'rejected';
        
        $sql = "UPDATE loan_requests 
                SET status = :status, 
                    approved_by = :admin_id, 
                    approval_date = NOW() 
                WHERE loan_id = :id";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':status' => $new_status,
            ':admin_id' => $_SESSION['user_id'],
            ':id' => $id
        ]);
        
        // Get borrower ID for notification
        $borrower_stmt = $conn->prepare("SELECT borrower_id FROM loan_requests WHERE loan_id = ?");
        $borrower_stmt->execute([$id]);
        $borrower_id = $borrower_stmt->fetchColumn();
        
        // Create notification
        $notif_title = ($action === 'approve') ? 'Loan Request Approved' : 'Loan Request Rejected';
        $notif_message = ($action === 'approve') 
            ? 'Your loan request has been approved by admin.' 
            : 'Your loan request has been rejected by admin.';
        
        $notif_sql = "INSERT INTO notifications (user_id, type, title, message, loan_id) 
                      VALUES (:user_id, :type, :title, :message, :loan_id)";
        $notif_stmt = $conn->prepare($notif_sql);
        $notif_stmt->execute([
            ':user_id' => $borrower_id,
            ':type' => ($action === 'approve') ? 'approval' : 'rejection',
            ':title' => $notif_title,
            ':message' => $notif_message,
            ':loan_id' => $id
        ]);
        
    } elseif ($type === 'funding') {
        // Update crowdfunding post status
        $new_status = ($action === 'approve') ? 'open' : 'rejected';
        
        $sql = "UPDATE crowdfunding_posts 
                SET status = :status, 
                    approved_by = :admin_id, 
                    approval_date = NOW() 
                WHERE post_id = :id";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':status' => $new_status,
            ':admin_id' => $_SESSION['user_id'],
            ':id' => $id
        ]);
        
        // Get creator ID for notification
        $creator_stmt = $conn->prepare("SELECT creator_id FROM crowdfunding_posts WHERE post_id = ?");
        $creator_stmt->execute([$id]);
        $creator_id = $creator_stmt->fetchColumn();
        
        // Create notification
        $notif_title = ($action === 'approve') ? 'Fundraiser Approved' : 'Fundraiser Rejected';
        $notif_message = ($action === 'approve') 
            ? 'Your fundraiser has been approved and is now live!' 
            : 'Your fundraiser has been rejected by admin.';
        
        $notif_sql = "INSERT INTO notifications (user_id, type, title, message, post_id) 
                      VALUES (:user_id, :type, :title, :message, :post_id)";
        $notif_stmt = $conn->prepare($notif_sql);
        $notif_stmt->execute([
            ':user_id' => $creator_id,
            ':type' => ($action === 'approve') ? 'approval' : 'rejection',
            ':title' => $notif_title,
            ':message' => $notif_message,
            ':post_id' => $id
        ]);
    }
    
    $conn->commit();
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => ucfirst($type) . ' ' . $action . 'd successfully'
    ]);
    
} catch (PDOException $e) {
    $conn->rollBack();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
