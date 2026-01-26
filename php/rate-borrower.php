<?php
session_start();
include 'db_conn.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: ../login.html");
    exit();
}

$user_id = $_SESSION['user_id'];

if (isset($_POST['submit_rating'])) {
    $loan_id = $_POST['loan_id'];
    $score = intval($_POST['score']);
    $review = $_POST['review'];
    $recommend = $_POST['recommend'] ?? 'no';

    // Validate
    if (empty($loan_id) || $score < 1 || $score > 5) {
        echo "<script>alert('Invalid rating data. Please ensure you have rated.'); window.history.back();</script>";
        exit();
    }

    // Determine Ratee (Borrower) from Loan ID
    try {
        $stmt = $conn->prepare("SELECT borrower_id FROM loan_requests WHERE loan_id = ?");
        $stmt->execute([$loan_id]);
        $borrower_id = $stmt->fetchColumn();

        if (!$borrower_id) {
            echo "<script>alert('Loan not found.'); window.location='../loan.html';</script>";
            exit();
        }

        // Check if user has made an offer on this loan (only lenders can rate)
        $offer_check = $conn->prepare("SELECT offer_id FROM loan_offers WHERE loan_id = ? AND lender_id = ?");
        $offer_check->execute([$loan_id, $user_id]);
        if ($offer_check->rowCount() == 0) {
            echo "<script>alert('You must be a lender on this loan to rate the borrower.'); window.location='../loan.html';</script>";
            exit();
        }

        // Check if already rated
        $check = $conn->prepare("SELECT rating_id FROM loan_ratings WHERE loan_id = ? AND rater_id = ?");
        $check->execute([$loan_id, $user_id]);
        if ($check->rowCount() > 0) {
            echo "<script>alert('You have already rated this loan.'); window.location='../index.html';</script>";
            exit();
        }

        // Insert Rating
        // Note: The form collects 'recommend' but the schema for loan_ratings only has 'review'.
        // We will append recommendation to the review text.
        $final_review = $review . " [Recommended: " . ucfirst($recommend) . "]";

        $sql = "INSERT INTO loan_ratings (rater_id, ratee_id, loan_id, score, review) 
                VALUES (:rater_id, :ratee_id, :loan_id, :score, :review)";

        $insert = $conn->prepare($sql);
        $insert->execute([
            ':rater_id' => $user_id,
            ':ratee_id' => $borrower_id,
            ':loan_id' => $loan_id,
            ':score' => $score,
            ':review' => $final_review
        ]);

        // Notify Borrower (Optional)
        $notif_sql = "INSERT INTO notifications (user_id, type, title, message, loan_id) 
                      VALUES (:user_id, 'rating', 'New Review', 'You have received a new rating.', :loan_id)";
        $conn->prepare($notif_sql)->execute([
            ':user_id' => $borrower_id,
            ':loan_id' => $loan_id
        ]);

        echo "<script>
            localStorage.setItem('ratingSuccess', 'true');
            window.location='../loan.html';
        </script>";
    } catch (PDOException $e) {
        echo "Database Error: " . $e->getMessage();
    }
} else {
    header("Location: ../rate-borrower.html");
}
