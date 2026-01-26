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
    // Fetch all crowdfunding posts with creator information
    $sql = "SELECT 
                cp.post_id,
                cp.creator_id,
                cp.category,
                cp.custom_category,
                cp.title,
                cp.summary,
                cp.location,
                cp.num_people,
                cp.age_group,
                cp.amount_needed,
                cp.status,
                cp.created_at,
                u.username,
                u.full_name,
                u.email,
                u.phone,
                u.verification_status,
                COUNT(DISTINCT cd.doc_id) as document_count,
                COALESCE(SUM(cc.amount), 0) as amount_raised
            FROM crowdfunding_posts cp
            JOIN users u ON cp.creator_id = u.user_id
            LEFT JOIN crowdfunding_documents cd ON cp.post_id = cd.post_id
            LEFT JOIN crowdfunding_contributions cc ON cp.post_id = cc.post_id AND cc.payment_status = 'completed'
            WHERE cp.status IN ('pending', 'approved', 'open')
            GROUP BY cp.post_id
            ORDER BY cp.created_at DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'posts' => $posts
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
