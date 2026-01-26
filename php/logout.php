<?php
session_start();
session_unset();
session_destroy();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Logging Out...</title>
</head>
<body>
    <script>
        // Clear frontend state matching header-footer.js logic
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userName");
        localStorage.removeItem("userAvatar");
        localStorage.removeItem("userRole");
        
        // Redirect
        window.location.href = "index.html";
    </script>
</body>
</html>
