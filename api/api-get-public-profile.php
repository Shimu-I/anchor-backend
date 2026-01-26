<?php
session_start();
require_once '../php/db_conn.php';

header('Content-Type: application/json');

try {
    // Get user ID from URL parameter
    if (!isset($_GET['userId'])) {
        echo json_encode([
            'success' => false,
            'error' => 'User ID is required'
        ]);
        exit;
    }

    $user_id = intval($_GET['userId']);

    // Get user information (public data only)
    $userQuery = "SELECT 
                    user_id,
                    username,
                    full_name,
                    student_id,
                    university,
                    verification_status,
                    role,
                    created_at
                  FROM users 
                  WHERE user_id = :user_id";

    $stmt = $conn->prepare($userQuery);
    $stmt->execute([':user_id' => $user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode([
            'success' => false,
            'error' => 'User not found'
        ]);
        exit;
    }

    // Get user's average rating
    $ratingQuery = "SELECT 
                      AVG(score) as avg_rating,
                      COUNT(*) as rating_count
                    FROM loan_ratings 
                    WHERE ratee_id = :user_id";

    $stmt = $conn->prepare($ratingQuery);
    $stmt->execute([':user_id' => $user_id]);
    $ratingData = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get loan requests statistics
    $loanStatsQuery = "SELECT 
                         COUNT(*) as total_loans,
                         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_loans,
                         COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_loans,
                         COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_loans,
                         COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) as total_loan_amount
                       FROM loan_requests 
                       WHERE borrower_id = :user_id";

    $stmt = $conn->prepare($loanStatsQuery);
    $stmt->execute([':user_id' => $user_id]);
    $loanStats = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get funding posts statistics
    $fundingStatsQuery = "SELECT 
                            COUNT(*) as total_funding,
                            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_funding,
                            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_funding,
                            COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_funding,
                            COALESCE(SUM(CASE WHEN status = 'approved' THEN amount_needed ELSE 0 END), 0) as total_funding_amount
                          FROM crowdfunding_posts 
                          WHERE creator_id = :user_id";

    $stmt = $conn->prepare($fundingStatsQuery);
    $stmt->execute([':user_id' => $user_id]);
    $fundingStats = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get actual money received from funding contributions
    $fundingReceivedQuery = "SELECT COALESCE(SUM(cc.amount), 0) as total_funding_received
                             FROM crowdfunding_contributions cc
                             INNER JOIN crowdfunding_posts cp ON cc.post_id = cp.post_id
                             WHERE cp.creator_id = :user_id AND cc.payment_status = 'completed'";

    $stmt = $conn->prepare($fundingReceivedQuery);
    $stmt->execute([':user_id' => $user_id]);
    $fundingReceived = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get actual money received from loan offers (accepted offers)
    $loansReceivedQuery = "SELECT COALESCE(SUM(lo.amount), 0) as total_loans_received
                           FROM loan_offers lo
                           INNER JOIN loan_requests lr ON lo.loan_id = lr.loan_id
                           WHERE lr.borrower_id = :user_id AND lo.status = 'accepted'";

    $stmt = $conn->prepare($loansReceivedQuery);
    $stmt->execute([':user_id' => $user_id]);
    $loansReceived = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get loan offers made (as a lender)
    $offersQuery = "SELECT 
                        COUNT(*) as total_offers,
                        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_offers,
                        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_offers,
                        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_offers
                    FROM loan_offers 
                    WHERE lender_id = :user_id";

    $stmt = $conn->prepare($offersQuery);
    $stmt->execute([':user_id' => $user_id]);
    $offersData = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get all approved loan requests with details
    $loansQuery = "SELECT 
                     lr.loan_id,
                     lr.amount,
                     lr.category,
                     lr.custom_category,
                     lr.reason,
                     lr.status,
                     lr.interest_rate,
                     lr.duration_months,
                     lr.created_at
                   FROM loan_requests lr
                   WHERE lr.borrower_id = :user_id AND lr.status = 'approved'
                   ORDER BY lr.created_at DESC";

    $stmt = $conn->prepare($loansQuery);
    $stmt->execute([':user_id' => $user_id]);
    $loans = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all approved funding posts with details
    $fundingQuery = "SELECT 
                       cp.post_id,
                       cp.title,
                       cp.summary,
                       cp.amount_needed,
                       cp.category,
                       cp.custom_category,
                       cp.status,
                       cp.created_at,
                       COALESCE(SUM(cc.amount), 0) as amount_raised,
                       COUNT(cc.contrib_id) as contributor_count
                     FROM crowdfunding_posts cp
                     LEFT JOIN crowdfunding_contributions cc ON cp.post_id = cc.post_id AND cc.payment_status = 'completed'
                     WHERE cp.creator_id = :user_id AND cp.status = 'approved'
                     GROUP BY cp.post_id
                     ORDER BY cp.created_at DESC";

    $stmt = $conn->prepare($fundingQuery);
    $stmt->execute([':user_id' => $user_id]);
    $funding = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all loan offers made by this user
    $myOffersQuery = "SELECT 
                        lo.offer_id,
                        lo.loan_id,
                        lo.amount,
                        lo.interest_rate,
                        lo.status,
                        lo.terms,
                        lo.created_at,
                        lr.amount as loan_amount,
                        lr.category,
                        lr.custom_category,
                        lr.reason,
                        u.full_name as borrower_name,
                        u.user_id as borrower_id
                      FROM loan_offers lo
                      INNER JOIN loan_requests lr ON lo.loan_id = lr.loan_id
                      INNER JOIN users u ON lr.borrower_id = u.user_id
                      WHERE lo.lender_id = :user_id
                      ORDER BY lo.created_at DESC";

    $stmt = $conn->prepare($myOffersQuery);
    $stmt->execute([':user_id' => $user_id]);
    $offers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Prepare response
    $response = [
        'success' => true,
        'user' => [
            'user_id' => $user['user_id'],
            'username' => $user['username'],
            'full_name' => $user['full_name'],
            'student_id' => $user['student_id'],
            'university' => $user['university'],
            'verification_status' => $user['verification_status'],
            'role' => $user['role'],
            'created_at' => $user['created_at'],
            'avg_rating' => $ratingData['avg_rating'] ? round($ratingData['avg_rating'], 1) : null,
            'rating_count' => $ratingData['rating_count']
        ],
        'statistics' => [
            'total_loans' => intval($loanStats['total_loans']),
            'pending_loans' => intval($loanStats['pending_loans']),
            'approved_loans' => intval($loanStats['approved_loans']),
            'rejected_loans' => intval($loanStats['rejected_loans']),
            'total_funding' => intval($fundingStats['total_funding']),
            'pending_funding' => intval($fundingStats['pending_funding']),
            'approved_funding' => intval($fundingStats['approved_funding']),
            'rejected_funding' => intval($fundingStats['rejected_funding']),
            'total_offers' => intval($offersData['total_offers']),
            'pending_offers' => intval($offersData['pending_offers']),
            'accepted_offers' => intval($offersData['accepted_offers']),
            'rejected_offers' => intval($offersData['rejected_offers']),
            'total_funding_received' => floatval($fundingReceived['total_funding_received']),
            'total_loans_received' => floatval($loansReceived['total_loans_received'])
        ],
        'loans' => $loans,
        'funding' => $funding,
        'offers' => $offers
    ];

    echo json_encode($response);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error: ' . $e->getMessage()
    ]);
}
