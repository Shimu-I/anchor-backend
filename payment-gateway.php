<?php
session_start();
include 'db_conn.php';

// Check Login (Assuming users must be logged in to pay/donate)
// In some crowdfunding scenarios, guest donations are allowed, but we'll enforce login for now based on schema (contributor_id)
if (!isset($_SESSION['user_id'])) {
    // If not logged in, redirect to login with return URL?
    // For simplicity, just redirect to login
    header("Location: login.html");
    exit();
}

$user_id = $_SESSION['user_id'];

if (isset($_POST['submit_payment'])) {

    // 1. Collect Data
    $amount = $_POST['ref_amount'];
    $type = $_POST['ref_type']; // 'loan' or 'funding'
    $ref_id = $_POST['ref_id'];
    $method = $_POST['payment_method']; // 'card' or 'mobile'

    // Optional Details
    $card_number = $_POST['card_number'] ?? '';
    // ... other card details
    $mobile_provider = $_POST['mobile_provider'] ?? '';

    // Construct Payment Method String
    $payment_method_str = $method;
    if ($method === 'mobile') {
        $payment_method_str .= " (" . $mobile_provider . ")";
    } else {
        $payment_method_str .= " (ending " . substr($card_number, -4) . ")";
    }

    // 2. Validate
    if (empty($amount) || empty($type) || empty($ref_id)) {
        echo "<script>alert('Invalid Payment Request. Missing details.'); window.location='index.html';</script>";
        exit();
    }

    if ($method === 'mobile' && empty($mobile_provider)) {
        echo "<script>alert('Please select a mobile banking provider.'); window.history.back();</script>";
        exit();
    }

    // Simulate Payment Processing
    // In real world, call Stripe/SSLCommerz API here.
    $payment_successful = true;
    $transaction_id = "TXN" . uniqid() . strtoupper(substr(md5(time()), 0, 5));

    if ($payment_successful) {
        try {
            $conn->beginTransaction();

            if ($type === 'loan') {
                // Insert into loan_contributions
                $sql = "INSERT INTO loan_contributions (contributor_id, loan_id, amount, payment_method, payment_status, transaction_id) 
                        VALUES (:uid, :rid, :amt, :pm, 'completed', :tid)";
                // Note: DB trigger 'trg_update_loan_status_on_funding' will run automatically

            } elseif ($type === 'funding') {
                // Insert into crowdfunding_contributions
                $sql = "INSERT INTO crowdfunding_contributions (contributor_id, post_id, amount, payment_method, payment_status, transaction_id) 
                        VALUES (:uid, :rid, :amt, :pm, 'completed', :tid)";
                // Note: DB trigger 'trg_update_post_status_on_funding' will run automatically
            } else {
                throw new Exception("Unknown payment type.");
            }

            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':uid' => $user_id,
                ':rid' => $ref_id,
                ':amt' => $amount,
                ':pm'  => $payment_method_str,
                ':tid' => $transaction_id
            ]);

            // Create notification for the creator
            if ($type === 'funding') {
                // Get creator ID
                $creator_stmt = $conn->prepare("SELECT creator_id FROM crowdfunding_posts WHERE post_id = ?");
                $creator_stmt->execute([$ref_id]);
                $creator = $creator_stmt->fetch(PDO::FETCH_ASSOC);

                if ($creator) {
                    $notif_sql = "INSERT INTO notifications (user_id, message, type, post_id, title) 
                                  VALUES (:creator_id, :msg, 'contribution', :post_id, 'New Donation Received')";
                    $notif_stmt = $conn->prepare($notif_sql);
                    $notif_stmt->execute([
                        ':creator_id' => $creator['creator_id'],
                        ':msg' => "You received a new donation of ৳" . number_format($amount, 2) . " for your fundraiser!",
                        ':post_id' => $ref_id
                    ]);
                }
            } elseif ($type === 'loan') {
                // Get borrower ID
                $borrower_stmt = $conn->prepare("SELECT borrower_id FROM loan_requests WHERE loan_id = ?");
                $borrower_stmt->execute([$ref_id]);
                $borrower = $borrower_stmt->fetch(PDO::FETCH_ASSOC);

                if ($borrower) {
                    $notif_sql = "INSERT INTO notifications (user_id, message, type, loan_id, title) 
                                  VALUES (:borrower_id, :msg, 'contribution', :loan_id, 'New Loan Contribution')";
                    $notif_stmt = $conn->prepare($notif_sql);
                    $notif_stmt->execute([
                        ':borrower_id' => $borrower['borrower_id'],
                        ':msg' => "You received a new loan contribution of ৳" . number_format($amount, 2) . "!",
                        ':loan_id' => $ref_id
                    ]);
                }
            }

            $conn->commit();

            // Redirect with success parameter
            if ($type === 'funding') {
                header("Location: funding.html?success=1&amount=" . urlencode($amount) . "&txn=" . urlencode($transaction_id));
                exit;
            } elseif ($type === 'loan') {
                header("Location: loan.html?success=1&amount=" . urlencode($amount) . "&txn=" . urlencode($transaction_id));
                exit;
            } else {
                header("Location: index.html?success=1");
                exit;
            }
        } catch (Exception $e) {
            $conn->rollBack();
            echo "Payment Error: " . $e->getMessage();
        }
    } else {
        echo "<script>alert('Payment Failed. Please try again.'); window.history.back();</script>";
    }
} else {
    header("Location: index.html");
}
