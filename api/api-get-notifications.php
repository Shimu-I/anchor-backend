<?php
session_start();
require_once '../php/db_conn.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Not logged in'
    ]);
    exit;
}

try {
    $user_id = $_SESSION['user_id'];

    // Get notifications from the notifications table
    $query = "SELECT 
                n.notification_id,
                n.user_id,
                n.type,
                n.title,
                n.message,
                n.reference_id,
                n.reference_type,
                n.is_read,
                n.created_at,
                u.full_name as sender_name
              FROM notifications n
              LEFT JOIN users u ON n.sender_id = u.user_id
              WHERE n.user_id = :user_id
              ORDER BY n.created_at DESC
              LIMIT 50";

    $stmt = $conn->prepare($query);
    $stmt->execute([':user_id' => $user_id]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get unread count
    $unreadQuery = "SELECT COUNT(*) as unread_count 
                    FROM notifications 
                    WHERE user_id = :user_id AND is_read = 0";

    $stmt = $conn->prepare($unreadQuery);
    $stmt->execute([':user_id' => $user_id]);
    $unreadData = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'notifications' => $notifications,
        'unread_count' => $unreadData['unread_count']
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
