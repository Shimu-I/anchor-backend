<?php
// Test API directly
$response = file_get_contents('http://localhost/lb1/api-get-approved-funding.php');
echo $response;
