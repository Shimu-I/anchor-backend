<?php
require 'db_conn.php';

echo "=== CROWDFUNDING POSTS IN DATABASE ===\n\n";

$stmt = $conn->query("SELECT post_id, title, category, custom_category, status, amount_needed, created_at 
                      FROM crowdfunding_posts 
                      ORDER BY created_at DESC");

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $category = $row['custom_category'] ?? $row['category'];
    echo "ID: {$row['post_id']}\n";
    echo "Status: {$row['status']}\n";
    echo "Category: $category\n";
    echo "Title: {$row['title']}\n";
    echo "Amount: {$row['amount_needed']}\n";
    echo "Created: {$row['created_at']}\n";
    echo "---\n";
}

echo "\n=== TESTING API ===\n";
$stmt2 = $conn->query("SELECT COUNT(*) as count FROM crowdfunding_posts WHERE status IN ('approved', 'open', 'funded')");
$count = $stmt2->fetch(PDO::FETCH_ASSOC);
echo "Posts with status approved/open/funded: {$count['count']}\n";
