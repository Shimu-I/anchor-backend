<?php
session_start();
include '../php/db_conn.php';

// Check if admin is logged in
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

// Handle DELETE request
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    parse_str(file_get_contents("php://input"), $_DELETE);
    $post_id = $_DELETE['post_id'] ?? 0;

    if (empty($post_id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing post ID']);
        exit();
    }

    try {
        $conn->beginTransaction();

        // Delete crowdfunding post (CASCADE will handle documents and contributions)
        $sql = "DELETE FROM crowdfunding_posts WHERE post_id = :post_id";
        $stmt = $conn->prepare($sql);
        $stmt->execute([':post_id' => $post_id]);

        $conn->commit();

        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => 'Fundraiser deleted successfully'
        ]);
    } catch (PDOException $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
    exit();
}

// Handle PUT request for status toggle
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    parse_str(file_get_contents("php://input"), $_PUT);
    $post_id = $_PUT['post_id'] ?? 0;
    $new_status = $_PUT['status'] ?? '';

    if (empty($post_id) || empty($new_status)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing parameters']);
        exit();
    }

    try {
        $sql = "UPDATE crowdfunding_posts 
                SET status = :status, 
                    approved_by = :admin_id, 
                    approval_date = NOW() 
                WHERE post_id = :post_id";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':status' => $new_status,
            ':admin_id' => $_SESSION['user_id'],
            ':post_id' => $post_id
        ]);

        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => 'Status updated successfully'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
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
