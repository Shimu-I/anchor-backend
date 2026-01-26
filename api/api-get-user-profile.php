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

    // Get user information
    $userQuery = "SELECT 
                    user_id,
                    username,
                    email,
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
    $offersQuery = "SELECT COUNT(*) as total_offers
                    FROM loan_offers 
                    WHERE lender_id = :user_id";

    $stmt = $conn->prepare($offersQuery);
    $stmt->execute([':user_id' => $user_id]);
    $offersData = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get all loan requests with details
    $loansQuery = "SELECT 
                     lr.loan_id,
                     lr.amount,
                     lr.category,
                     lr.custom_category,
                     lr.reason,
                     lr.status,
                     lr.created_at,
                     lr.duration_months,
                     lr.custom_duration,
                     COUNT(DISTINCT lo.offer_id) as offer_count
                   FROM loan_requests lr
                   LEFT JOIN loan_offers lo ON lr.loan_id = lo.loan_id
                   WHERE lr.borrower_id = :user_id
                   GROUP BY lr.loan_id
                   ORDER BY lr.created_at DESC";

    $stmt = $conn->prepare($loansQuery);
    $stmt->execute([':user_id' => $user_id]);
    $loans = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all funding posts with details
    $fundingQuery = "SELECT 
                       cp.post_id,
                       cp.title,
                       cp.amount_needed,
                       COALESCE(SUM(CASE WHEN cc.payment_status = 'completed' THEN cc.amount ELSE 0 END), 0) as current_amount,
                       cp.category,
                       cp.custom_category,
                       cp.status,
                       cp.created_at,
                       COUNT(DISTINCT cc.contrib_id) as contribution_count
                     FROM crowdfunding_posts cp
                     LEFT JOIN crowdfunding_contributions cc ON cp.post_id = cc.post_id
                     WHERE cp.creator_id = :user_id
                     GROUP BY cp.post_id
                     ORDER BY cp.created_at DESC";

    $stmt = $conn->prepare($fundingQuery);
    $stmt->execute([':user_id' => $user_id]);
    $fundingPosts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get loan offers made (as a lender)
    $myOffersQuery = "SELECT 
                        lo.offer_id,
                        lo.amount as offer_amount,
                        lo.interest_rate,
                        lo.status as offer_status,
                        lo.created_at,
                        lr.loan_id,
                        lr.amount as loan_amount,
                        lr.category,
                        lr.custom_category,
                        u.full_name as borrower_name
                      FROM loan_offers lo
                      INNER JOIN loan_requests lr ON lo.loan_id = lr.loan_id
                      INNER JOIN users u ON lr.borrower_id = u.user_id
                      WHERE lo.lender_id = :user_id
                      ORDER BY lo.created_at DESC";

    $stmt = $conn->prepare($myOffersQuery);
    $stmt->execute([':user_id' => $user_id]);
    $myOffers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'user' => $user,
        'rating' => [
            'avg_rating' => $ratingData['avg_rating'] ? round($ratingData['avg_rating'], 1) : 0,
            'rating_count' => $ratingData['rating_count']
        ],
        'stats' => [
            'loans' => $loanStats,
            'funding' => $fundingStats,
            'offers_made' => $offersData['total_offers'],
            'total_funding_received' => $fundingReceived['total_funding_received'],
            'total_loans_received' => $loansReceived['total_loans_received']
        ],
        'loans' => $loans,
        'funding_posts' => $fundingPosts,
        'my_offers' => $myOffers
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
