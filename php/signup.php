<?php
session_start();
include 'db_conn.php';

if (isset($_POST['signup_btn'])) {
    $full_name = trim($_POST['full_name']);
    $username  = trim($_POST['username']);
    $email     = trim($_POST['email']);
    $password  = $_POST['password'];
    $phone     = trim($_POST['phone']);
    $student_id = trim($_POST['student_id']);
    $university = trim($_POST['university']);
    $nid_number = trim($_POST['nid_number']);
    $role      = $_POST['role'];

    // Basic Validation
    if (empty($full_name) || empty($email) || empty($password) || empty($username) || empty($role)) {
        echo "Required fields are missing.";
        exit();
    }

    // Handle File Upload (Profile Image)
    $profile_image = null;
    if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] == 0) {
        $allowed = ['jpg', 'jpeg', 'png', 'gif'];
        $filename = $_FILES['profile_image']['name'];
        $filetype = $_FILES['profile_image']['type'];
        $filesize = $_FILES['profile_image']['size'];
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        if (in_array($ext, $allowed)) {
            $new_filename = uniqid() . "." . $ext;
            $destination = "images/uploads/users/" . $new_filename;
            
            // Create directory if not exists
            if (!file_exists("images/uploads/users/")) {
                mkdir("images/uploads/users/", 0777, true);
            }

            if (move_uploaded_file($_FILES['profile_image']['tmp_name'], $destination)) {
                $profile_image = $destination;
            }
        }
    }

    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    try {
        $sql = "INSERT INTO users (username, full_name, email, password_hash, phone, student_id, university, nid_number, role, profile_image, verification_status) 
                VALUES (:username, :full_name, :email, :password_hash, :phone, :student_id, :university, :nid_number, :role, :profile_image, 'pending')";

        $stmt = $conn->prepare($sql);

        $stmt->execute([
            ':username'      => $username,
            ':full_name'     => $full_name,
            ':email'         => $email,
            ':password_hash' => $hashed_password,
            ':phone'         => $phone,
            ':student_id'    => $student_id,
            ':university'    => $university,
            ':nid_number'    => $nid_number,
            ':role'          => $role,
            ':profile_image' => $profile_image
        ]);

        $_SESSION['message'] = "Account created successfully! Please login.";
        header("Location: ../login.html");
        exit();

    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            // Duplicate entry
            echo "Error: Username or Email already exists.";
        } else {
            echo "Database Error: " . $e->getMessage();
        }
    }
}
?>
