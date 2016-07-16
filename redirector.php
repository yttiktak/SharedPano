<?php
$trigger = "ready/";
//session_start();
//$sesNonce = $_SESSION['nonce'];
//if (strlen($sesNonce)!=6) {
 // echo "NONCE ERROR"; // lazy lazy. Just, ok, so I got a session, must be my user calling, right? 
 // exit(); not while testing. 'sides, tests are not via page, so errereror allways.
//}
//$skinBase =  $_SESSION['skinBase'];

$uri = $_SERVER['REQUEST_URI'];
$pos = strpos($uri,$trigger);

$tailURI = substr($uri,$pos+strlen($trigger));
//$filteredURI = filter_var($tailURI,FILTER_SANITIZE_URL);

//skinBase will save me!! No need for tedious local file searching, and might interfere with testing.
/**
if (file_exists($filteredURI)) {
	exit();// should I return 404 or something? Anyway, this prevents grabbing local files.
}

if (0!=strpos($filteredURI,$skinBase) {
	exit(); // Reject requests not going to my proxied intent.
}
**/
$lastDot = strrpos($tailURI,'.');
$ext = substr($tailURI,$lastDot+1);
error_log("uri: ".$uri);
switch ($ext) {
  case 'png':
  case 'PNG':
    header('Content-Type: image/png');
    break;
  case 'tif':
  case 'TIF':
    header('Content-Type: image/tif');
  break;
  case 'jpg':
  case 'JPG': 
  default:
   error_log("this is considered an image/jpeg: ".$ext);
   header('Content-Type: image/jpeg');
}  

header('Cache-Control: max-age=60000'); // 6000000 about a month
header('Expires: '.gmdate('D, d M Y H:i:s \G\M\T', time() + (60 * 60 * 24 * 30)));

error_log("readfile: ".$tailURI);
if (!@readfile($tailURI)) {
   header('HTTP/1.0 404 Not Found'); 
}
?>
