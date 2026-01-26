<?php
session_start();
include 'db_conn.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: login.html");
    exit();
}

$user_id = $_SESSION['user_id'];

if (isset($_POST['submit_fundraiser'])) {

    // 1. Collect Data
    $category = $_POST['category'] ?? '';
    $custom_category = $_POST['custom_category'] ?? '';
    $title = $_POST['title'] ?? '';
    $summary = $_POST['summary'] ?? '';
    $location = $_POST['location'] ?? '';
    $num_people = $_POST['num_people'] ?? 0;
    $age_group = $_POST['age_group'] ?? '';
    $action_plan = $_POST['action_plan'] ?? '';
    $share_receipts = $_POST['share_receipts'] ?? 'yes';
    $extra_funds_handling = $_POST['extra_funds_handling'] ?? '';

    // Arrays
    $purposes = $_POST['purpose'] ?? [];
    $other_purpose = $_POST['other_purpose'] ?? '';
    $item_names = $_POST['item_name'] ?? [];
    $item_quantities = $_POST['item_quantity'] ?? [];
    $item_costs = $_POST['item_cost'] ?? [];

    $doc_type = $_POST['doc_type'] ?? 'other';
    $amount_needed = $_POST['amount_needed'] ?? 0;

    // 2. Validate Key Data
    if (empty($category) || empty($title) || empty($summary)) {
        echo "<script>alert('Please fill in required fields.'); window.location='funding-interface-form.html';</script>";
        exit();
    }

    // If customized category
    if ($category === 'custom' && empty($custom_category)) {
        echo "<script>alert('Please specify custom category.'); window.location='funding-interface-form.html';</script>";
        exit();
    }

    try {
        $conn->beginTransaction();

        // 3. Insert Post
        $sql = "INSERT INTO crowdfunding_posts 
                (creator_id, category, custom_category, title, summary, location, num_people, age_group, amount_needed, action_plan, share_receipts, extra_funds_handling, status) 
                VALUES (:creator_id, :category, :custom_category, :title, :summary, :location, :num_people, :age_group, :amount_needed, :action_plan, :share_receipts, :extra_funds_handling, 'pending')";

        $stmt = $conn->prepare($sql);

        $stmt->execute([
            ':creator_id' => $user_id,
            ':category' => $category,
            ':custom_category' => ($category === 'custom') ? $custom_category : null,
            ':title' => $title,
            ':summary' => $summary,
            ':location' => $location,
            ':num_people' => (int)$num_people,
            ':age_group' => $age_group,
            ':amount_needed' => $amount_needed,
            ':action_plan' => $action_plan,
            ':share_receipts' => $share_receipts,
            ':extra_funds_handling' => $extra_funds_handling
        ]);

        $post_id = $conn->lastInsertId();

        // 4. Insert Purposes
        $purpose_sql = "INSERT INTO funding_purposes (post_id, purpose_type, custom_purpose) VALUES (:post_id, :type, :custom)";
        $purpose_stmt = $conn->prepare($purpose_sql);

        foreach ($purposes as $p) {
            $custom_val = ($p === 'other') ? $other_purpose : null;
            $purpose_stmt->execute([
                ':post_id' => $post_id,
                ':type' => $p,
                ':custom' => $custom_val
            ]);
        }

        // 5. Insert Breakdown Items
        $breakdown_sql = "INSERT INTO fund_breakdown_items (post_id, item_name, quantity, cost_per_unit) VALUES (:post_id, :name, :qty, :cost)";
        $breakdown_stmt = $conn->prepare($breakdown_sql);

        for ($i = 0; $i < count($item_names); $i++) {
            if (!empty($item_names[$i])) {
                $breakdown_stmt->execute([
                    ':post_id' => $post_id,
                    ':name' => $item_names[$i],
                    ':qty' => $item_quantities[$i],
                    ':cost' => $item_costs[$i]
                ]);
            }
        }

        // 6. Handle Cover Photo Upload (if provided)
        if (isset($_FILES['cover_photo']) && $_FILES['cover_photo']['error'] == 0) {
            $filename = $_FILES['cover_photo']['name'];
            $filetmp = $_FILES['cover_photo']['tmp_name'];
            $filesize = $_FILES['cover_photo']['size'];
            $filetype = $_FILES['cover_photo']['type'];

            $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            $allowed_images = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

            if (in_array($ext, $allowed_images)) {
                $new_filename = uniqid() . "_cover_" . $filename;
                $path = "images/uploads/funding/" . $new_filename;

                // Create directory if not exists
                if (!file_exists("images/uploads/funding/")) {
                    mkdir("images/uploads/funding/", 0777, true);
                }

                if (move_uploaded_file($filetmp, $path)) {
                    // Insert cover photo as document with doc_type='other'
                    $doc_sql = "INSERT INTO crowdfunding_documents (post_id, doc_type, file_path, file_name, file_size, mime_type) 
                                VALUES (:post_id, 'other', :file_path, :file_name, :file_size, :mime_type)";
                    $doc_stmt = $conn->prepare($doc_sql);
                    $doc_stmt->execute([
                        ':post_id' => $post_id,
                        ':file_path' => $path,
                        ':file_name' => $filename,
                        ':file_size' => $filesize,
                        ':mime_type' => $filetype
                    ]);
                }
            }
        }

        // 7. Handle Additional Document Uploads
        if (isset($_FILES['crowd_documents'])) {
            $file_count = count($_FILES['crowd_documents']['name']);

            for ($i = 0; $i < $file_count; $i++) {
                if ($_FILES['crowd_documents']['error'][$i] == 0) {
                    $filename = $_FILES['crowd_documents']['name'][$i];
                    $filetmp = $_FILES['crowd_documents']['tmp_name'][$i];
                    $filesize = $_FILES['crowd_documents']['size'][$i];
                    $filetype = $_FILES['crowd_documents']['type'][$i];

                    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
                    $allowed = ['jpg', 'jpeg', 'png', 'pdf', 'mp4', 'mov'];

                    if (in_array($ext, $allowed)) {
                        $new_filename = uniqid() . "_fund_" . $filename;
                        $path = "images/uploads/funding/" . $new_filename;

                        // Create directory if not exists
                        if (!file_exists("images/uploads/funding/")) {
                            mkdir("images/uploads/funding/", 0777, true);
                        }

                        if (move_uploaded_file($filetmp, $path)) {
                            // Insert document record
                            $doc_sql = "INSERT INTO crowdfunding_documents (post_id, doc_type, file_path, file_name, file_size, mime_type) 
                                        VALUES (:post_id, :doc_type, :file_path, :file_name, :file_size, :mime_type)";
                            $doc_stmt = $conn->prepare($doc_sql);
                            $doc_stmt->execute([
                                ':post_id' => $post_id,
                                ':doc_type' => $doc_type,
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
        echo "<script>alert('Fundraiser Created Successfully!'); window.location='index.html';</script>";
    } catch (PDOException $e) {
        $conn->rollBack();
        echo "Database Error: " . $e->getMessage();
    }
} else {
    header("Location: funding-interface-form.html");
}
