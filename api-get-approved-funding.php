<?php
session_start();
include 'db_conn.php';

try {
    // Fetch approved and open crowdfunding posts with creator information and contribution totals
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
                u.profile_image,
                COALESCE(SUM(cc.amount), 0) as amount_raised,
                (
                    SELECT file_path 
                    FROM crowdfunding_documents cd 
                    WHERE cd.post_id = cp.post_id 
                    AND cd.doc_type = 'other' 
                    LIMIT 1
                ) as cover_image
            FROM crowdfunding_posts cp
            JOIN users u ON cp.creator_id = u.user_id
            LEFT JOIN crowdfunding_contributions cc ON cp.post_id = cc.post_id AND cc.payment_status = 'completed'
            WHERE cp.status IN ('approved', 'open', 'funded')
            GROUP BY cp.post_id
            ORDER BY cp.created_at DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Add fallback images based on category
    $categoryImages = [
        'Education' => 'images/categories/education.jpg',
        'Medical' => 'images/categories/medical.jpg',
        'Emergency' => 'images/categories/emergency.jpg',
        'Community' => 'images/categories/community.jpg',
        'Flood Relief' => 'images/flood-dummy.png',
        'Clothes Distribution' => 'images/cloth-dummy.png',
        'Accidents' => 'images/dummy-fund.png',
        'Mobile Clinic' => 'images/categories/medical.jpg',
        'Clean Water' => 'images/categories/community.jpg'
    ];

    foreach ($posts as &$post) {
        // Determine the display category (custom takes precedence if exists)
        $displayCategory = !empty($post['custom_category']) ? $post['custom_category'] : $post['category'];

        // If no cover image, use category-based fallback
        if (empty($post['cover_image'])) {
            $post['cover_image'] = $categoryImages[$displayCategory] ?? 'images/default-fundraiser.jpg';
        }

        // Store the display category
        $post['display_category'] = $displayCategory;

        // Format dates
        $post['created_at_formatted'] = date('d M, Y', strtotime($post['created_at']));

        // Calculate progress percentage
        $post['progress_percentage'] = $post['amount_needed'] > 0
            ? min(100, round(($post['amount_raised'] / $post['amount_needed']) * 100, 1))
            : 0;
    }

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
