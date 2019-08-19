<?php

# Init a curl connection to the original server
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://'.$_SERVER['SERVER_ADDR'].':8080/detect');
curl_setopt($ch, CURLOPT_POST, 1);
$post = array();

# Forward the image if present
if (isset($_FILES['image']))
{
    $post['image'] = curl_file_create($_FILES['image']['tmp_name']);
}

# Ditto for thresh
if (isset($_POST['thresh']))
{
    $post['thresh'] = $_POST['thresh'];
}
curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
curl_exec($ch);
curl_close($ch);
?>
