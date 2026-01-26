<?php
session_start();
include '../php/db_conn.php';

header('Content-Type: application/json');

try {
    // Get post_id from query parameter
    $post_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

    if ($post_id <= 0) {
        echo json_encode([
            'success' => false,
            'error' => 'Invalid post ID'
        ]);
        exit;
    }

    // Fetch the funding post with all details
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
                cp.action_plan,
                cp.share_receipts,
                cp.extra_funds_handling,
                cp.created_at,
                u.username,
                u.full_name,
                u.email,
                u.profile_image,
                COALESCE(SUM(cc.amount), 0) as amount_raised
            FROM crowdfunding_posts cp
            JOIN users u ON cp.creator_id = u.user_id
            LEFT JOIN crowdfunding_contributions cc ON cp.post_id = cc.post_id AND cc.payment_status = 'completed'
            WHERE cp.post_id = ? AND cp.status IN ('approved', 'open', 'funded')
            GROUP BY cp.post_id";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$post_id]);
    $post = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
        echo json_encode([
            'success' => false,
            'error' => 'Post not found or not approved'
        ]);
        exit;
    }

    // Fetch funding purposes
    $purpose_sql = "SELECT purpose_type, custom_purpose 
                    FROM funding_purposes 
                    WHERE post_id = ?";
    $purpose_stmt = $conn->prepare($purpose_sql);
    $purpose_stmt->execute([$post_id]);
    $purposes = $purpose_stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch breakdown items
    $breakdown_sql = "SELECT item_name, quantity, cost_per_unit 
                      FROM fund_breakdown_items 
                      WHERE post_id = ? 
                      ORDER BY breakdown_id";
    $breakdown_stmt = $conn->prepare($breakdown_sql);
    $breakdown_stmt->execute([$post_id]);
    $breakdown_items = $breakdown_stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch all images/documents for this post
    $doc_sql = "SELECT doc_id, doc_type, file_path 
                FROM crowdfunding_documents 
                WHERE post_id = ? 
                ORDER BY doc_type, doc_id";
    $doc_stmt = $conn->prepare($doc_sql);
    $doc_stmt->execute([$post_id]);
    $documents = $doc_stmt->fetchAll(PDO::FETCH_ASSOC);

    // Organize documents by type
    $post['documents'] = [
        'cover' => [],
        'other' => [],
        'verification' => []
    ];

    foreach ($documents as $doc) {
        $post['documents'][$doc['doc_type']][] = $doc['file_path'];
    }

    // Use first 'other' image as cover if available
    $post['cover_image'] = !empty($post['documents']['other'][0])
        ? $post['documents']['other'][0]
        : 'images/default-fundraiser.jpg';

    // Format purposes
    $post['purposes'] = array_map(function ($p) {
        return !empty($p['custom_purpose']) ? $p['custom_purpose'] : $p['purpose_type'];
    }, $purposes);

    // Format breakdown with costs
    $post['breakdown'] = array_map(function ($item) {
        $total = $item['quantity'] * $item['cost_per_unit'];
        return $item['item_name'] . ': ৳' . number_format($total, 0);
    }, $breakdown_items);

    // Parse action plan if it's JSON
    $action_plan_array = [];
    if (!empty($post['action_plan'])) {
        $decoded = json_decode($post['action_plan'], true);
        if (is_array($decoded)) {
            $action_plan_array = $decoded;
        } else {
            // If not JSON, split by newlines or use as single item
            $action_plan_array = array_filter(explode("\n", $post['action_plan']));
        }
    }
    $post['action_plan_steps'] = $action_plan_array;

    // Determine display category
    $post['display_category'] = !empty($post['custom_category']) ? $post['custom_category'] : $post['category'];

    // Format dates
    $post['created_at_formatted'] = date('d M, Y', strtotime($post['created_at']));

    // Calculate progress percentage
    $post['progress_percentage'] = $post['amount_needed'] > 0
        ? min(100, round(($post['amount_raised'] / $post['amount_needed']) * 100, 1))
        : 0;

    echo json_encode([
        'success' => true,
        'post' => $post
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
