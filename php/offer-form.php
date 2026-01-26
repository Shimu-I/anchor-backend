<?php
session_start();
include 'db_conn.php';

// Check login
if (!isset($_SESSION['user_id'])) {
    header("Location: ../login.html");
    exit();
}

$user_id = $_SESSION['user_id'];
$role = $_SESSION['role'];

// Only lenders can make offers (presumably? or anyone?)
// Assuming anyone for now or strictly lenders
// if ($role !== 'lender') { ... } 

if (isset($_POST['submit_offer'])) {

    // 1. Get Data
    $loan_id = $_POST['loan_id'];
    $amount = $_POST['amount'];
    $terms = $_POST['terms'];
    $interest_select = $_POST['interest_rate_select'];
    $custom_interest = $_POST['custom_interest_rate'];

    // Determine interest rate
    $interest_rate = 0;
    if ($interest_select === 'custom') {
        $interest_rate = $custom_interest;
    } else {
        $interest_rate = $interest_select;
    }

    // 2. Validate
    if (empty($loan_id) || empty($amount)) {
        echo "<script>alert('Invalid Request. Missing Loan ID or Amount.'); window.location='../loan.html';</script>";
        exit();
    }

    if ($amount <= 0) {
        echo "<script>alert('Offer amount must be greater than zero.'); history.back();</script>";
        exit();
    }

    // 3. Insert Offer
    try {
        // Check if loan exists and is active/pending
        $check_stmt = $conn->prepare("SELECT status, borrower_id FROM loan_requests WHERE loan_id = ?");
        $check_stmt->execute([$loan_id]);
        $loan_data = $check_stmt->fetch(PDO::FETCH_ASSOC);

        if (!$loan_data) {
            echo "<script>alert('Loan request not found.'); window.location='../loan.html';</script>";
            exit();
        }

        // Prevent users from making offers on their own loans
        if ($loan_data['borrower_id'] == $user_id) {
            echo "<script>alert('You cannot make an offer on your own loan request.'); window.location='../loan.html';</script>";
            exit();
        }

        if ($loan_data['status'] !== 'approved') {
            echo "<script>alert('This loan is not available for offers.'); window.location='../loan.html';</script>";
            exit();
        }

        $sql = "INSERT INTO loan_offers (loan_id, lender_id, amount, interest_rate, terms, status) 
                VALUES (:loan_id, :lender_id, :amount, :interest_rate, :terms, 'pending')";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':loan_id' => $loan_id,
            ':lender_id' => $user_id,
            ':amount' => $amount,
            ':interest_rate' => $interest_rate,
            ':terms' => $terms
        ]);

        // Notify Borrower (Optional, inserts into notifications table)
        // Get borrower ID
        $borrower_id = $loan_data['borrower_id'];

        if ($borrower_id) {
            $notif_sql = "INSERT INTO notifications (user_id, type, title, message, loan_id) 
                          VALUES (:user_id, 'loan_offer', 'New Loan Offer', 'You have received a loan offer.', :loan_id)";
            $conn->prepare($notif_sql)->execute([
                ':user_id' => $borrower_id,
                ':loan_id' => $loan_id
            ]);
        }

        echo "<script>
            localStorage.setItem('offerSuccess', 'true');
            window.location='../loan.html';
        </script>";
    } catch (PDOException $e) {
        // Check for duplicate offer constraint
        if ($e->getCode() == 23000) {
            echo "<script>alert('You have already made an offer on this loan.'); window.location='../loan.html';</script>";
        } else {
            echo "<script>alert('Database Error: " . addslashes($e->getMessage()) . "'); history.back();</script>";
        }
    }
} else {
    header("Location: ../index.html");
}
