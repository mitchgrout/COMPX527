<?php
$url = 'http://127.0.0.1:8080/info?';
if (isset($_GET['from'])) $url = $url."from=".$_GET['from'].'&';
if (isset($_GET['to']))   $url = $url."to="  .$_GET['to']  .'&';
$options = array(
    'http' => array(
    'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
    'method'  => 'GET'
    )
);
$context  = stream_context_create($options);
$result   = file_get_contents($url, false, $context);
echo $result;
?>
