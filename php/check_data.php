<?php
include 'db_conn.php';

echo "=== Database Data Check ===\n\n";

// Check users
$stmt = $conn->query('SELECT COUNT(*) FROM users');
echo 'Total Users: ' . $stmt->fetchColumn() . "\n";

$stmt = $conn->query("SELECT COUNT(*) FROM users WHERE role != 'admin'");
echo 'Non-admin Users: ' . $stmt->fetchColumn() . "\n\n";

// Check loan requests
$stmt = $conn->query('SELECT COUNT(*) FROM loan_requests');
echo 'Total Loan Requests: ' . $stmt->fetchColumn() . "\n";

$stmt = $conn->query("SELECT COUNT(*) FROM loan_requests WHERE status = 'pending'");
echo 'Pending Loans: ' . $stmt->fetchColumn() . "\n";

$stmt = $conn->query("SELECT COUNT(*) FROM loan_requests WHERE status = 'approved'");
echo 'Approved Loans: ' . $stmt->fetchColumn() . "\n\n";

// Check crowdfunding
$stmt = $conn->query('SELECT COUNT(*) FROM crowdfunding_posts');
echo 'Total Fundraisers: ' . $stmt->fetchColumn() . "\n";

$stmt = $conn->query("SELECT COUNT(*) FROM crowdfunding_posts WHERE status = 'pending'");
echo 'Pending Fundraisers: ' . $stmt->fetchColumn() . "\n";

$stmt = $conn->query("SELECT COUNT(*) FROM crowdfunding_posts WHERE status IN ('approved', 'open')");
echo 'Active Fundraisers: ' . $stmt->fetchColumn() . "\n\n";

// Check contributions
$stmt = $conn->query('SELECT COUNT(*) FROM loan_contributions');
echo 'Loan Contributions: ' . $stmt->fetchColumn() . "\n";

$stmt = $conn->query('SELECT COUNT(*) FROM crowdfunding_contributions');
echo 'Crowdfunding Contributions: ' . $stmt->fetchColumn() . "\n\n";

// Check documents
$stmt = $conn->query('SELECT COUNT(*) FROM user_documents');
echo 'User Documents: ' . $stmt->fetchColumn() . "\n";

$stmt = $conn->query('SELECT COUNT(DISTINCT user_id) FROM user_documents');
echo 'Users with Documents: ' . $stmt->fetchColumn() . "\n\n";

// Check total disbursed
$stmt = $conn->query("SELECT COALESCE(SUM(amount), 0) FROM loan_requests WHERE status = 'approved'");
echo 'Total Disbursed Amount: ৳' . number_format($stmt->fetchColumn(), 2) . "\n";
