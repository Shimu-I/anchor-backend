<?php
session_start();
include 'db_conn.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: ../login.html");
    exit();
}

$user_id = $_SESSION['user_id'];

if (isset($_POST['submit_loan_request'])) {

    // 1. Collect Data
    $category = $_POST['category'] ?? '';
    $custom_category = $_POST['custom_category'] ?? '';
    $amount = $_POST['amount'] ?? 0;
    $duration = $_POST['duration'] ?? '';
    $custom_duration = $_POST['custom_duration'] ?? '';
    $repayment_option = $_POST['repayment_option'] ?? '';
    $reason = $_POST['reason'] ?? '';
    $doc_type = $_POST['doc_type'] ?? 'other'; // Added drop down in HTML

    // 2. Validate Data
    if (empty($category) || empty($amount) || empty($duration) || empty($repayment_option) || empty($reason)) {
        echo "<script>alert('All fields are required.'); window.location='../loan-request-form.html';</script>";
        exit();
    }

    if ($category === 'custom' && empty($custom_category)) {
        echo "<script>alert('Please specify custom category.'); window.location='../loan-request-form.html';</script>";
        exit();
    }

    if ($duration === 'custom' && empty($custom_duration)) {
        echo "<script>alert('Please specify custom duration.'); window.location='../loan-request-form.html';</script>";
        exit();
    }

    // 3. Insert into Loan Requests
    try {
        $conn->beginTransaction();

        $sql = "INSERT INTO loan_requests (borrower_id, category, custom_category, amount, duration_months, custom_duration, repayment_option, reason, status) 
                VALUES (:borrower_id, :category, :custom_category, :amount, :duration_months, :custom_duration, :repayment_option, :reason, 'pending')";

        $stmt = $conn->prepare($sql);

        $duration_val = ($duration === 'custom') ? null : (int)$duration;

        $stmt->execute([
            ':borrower_id' => $user_id,
            ':category' => $category,
            ':custom_category' => ($category === 'custom') ? $custom_category : null,
            ':amount' => $amount,
            ':duration_months' => $duration_val,
            ':custom_duration' => ($duration === 'custom') ? $custom_duration : null,
            ':repayment_option' => $repayment_option,
            ':reason' => $reason
        ]);

        $loan_id = $conn->lastInsertId();

        // 4. Handle File Uploads
        if (isset($_FILES['loan_documents'])) {
            $file_count = count($_FILES['loan_documents']['name']);

            for ($i = 0; $i < $file_count; $i++) {
                if ($_FILES['loan_documents']['error'][$i] == 0) {
                    $filename = $_FILES['loan_documents']['name'][$i];
                    $filetmp = $_FILES['loan_documents']['tmp_name'][$i];
                    $filesize = $_FILES['loan_documents']['size'][$i];
                    $filetype = $_FILES['loan_documents']['type'][$i];

                    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
                    $allowed = ['jpg', 'jpeg', 'png', 'pdf'];

                    if (in_array($ext, $allowed)) {
                        $new_filename = uniqid() . "_" . $filename;
                        $path = "images/uploads/loans/" . $new_filename;

                        if (!file_exists("images/uploads/loans/")) {
                            mkdir("images/uploads/loans/", 0777, true);
                        }

                        if (move_uploaded_file($filetmp, $path)) {
                            // Insert document record
                            $doc_sql = "INSERT INTO loan_documents (loan_id, doc_type, file_path, file_name, file_size, mime_type) 
                                        VALUES (:loan_id, :doc_type, :file_path, :file_name, :file_size, :mime_type)";
                            $doc_stmt = $conn->prepare($doc_sql);
                            $doc_stmt->execute([
                                ':loan_id' => $loan_id,
                                ':doc_type' => $doc_type, // Ideally should allow per-file type selection, but broadly applies here
                                ':file_path' => $path,
                                ':file_name' => $filename,
                                ':file_size' => $filesize,
                                ':mime_type' => $filetype
                            ]);
                        }
                    }
                }
            }
        }

        $conn->commit();
        echo "<script>
            localStorage.setItem('loanRequestSuccess', 'true');
            window.location='../loan.html';
        </script>";
    } catch (PDOException $e) {
        $conn->rollBack();
        echo "Database Error: " . $e->getMessage();
    }
} else {
    header("Location: ../loan-request-form.html");
}
