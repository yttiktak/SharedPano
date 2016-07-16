<?php
// NEED TO REFLECT 404 FROM THE PROXY
$triggerStr = "readyXml"; // I am using TEXT trigger string to get to the testing version: "TEXTyXml";
$triggerForLevels = "ready/";
session_start();
$sesNonce = $_SESSION['nonce'];
if (strlen($sesNonce)!=6) {
 // echo "NONCE ERROR"; // lazy lazy. Just, ok, so I got a session, must be my user calling, right? 
 // exit(); not while testing. 'sides, tests are not via page, so errereror allways.
}



$server = $_SERVER['SERVER_NAME']; // www.repeatingshadow.com or localhost
$uri = $_SERVER['REQUEST_URI'];

$pos = strpos($uri,$triggerStr); 
$tailURI = substr($uri,$pos+strlen($triggerStr)+1);
$antiTail = substr($uri,0,$pos); 				// should detect https, but I am not using it (yet)
$redirecturl = "http://".$server.$antiTail.$triggerForLevels; // gives http://localhost/Output/ready/
error_log("*************** redirecturl: ".$redirecturl);


if (!$theXml = file_get_contents($tailURI)) {
	header("HTTP/1.0 404 Not Found");
	exit(); // SEND 404 AND EXIT IF FILE NOT FOUND
} else {
	header('Content-Type: text/xml; charset=UTF-8');
	// header('Content-Type: text/plain; charset=UTF-8'); // if you want a debug view
}


$newtail = preg_replace('/[^\/]*\.xml$/i','',$tailURI); // remove 'stuff.xml' from the url
// need this to be $newtail = preg_replace('/[^\/]*(\.xml|\.swf)$/i','',$tailURI);
// nope. The swap from .swf to .xml is done in the pano2vr_player prior to download
error_log("*************** newtail: ".$newtail);
// now replace all  leveltileurl with redirect
$xml1 = preg_replace('/ leveltileurl="/i', ' leveltileurl="'.$redirecturl.$newtail, $theXml);

// and then the values of all url= statements for jpg or png
$replacement = ' url="'.$redirecturl.$newtail.'$1';
$newxml = preg_replace('/ url="(.*jpg|.*png|.*gif|.*tif)/i', $replacement, $xml1);

// Ok, I used preg_replace to swap in my cors bypass urls for the links. 
// Now I need to locate the hotspots where I can insert my return link.
$con = new DOMDocument(); // Use SimpleXMLElement($theXml)? Not so much. Use DOM
$con->loadXML($newxml); // No validate, ok? That needs a dtd doco for ($con->validate()).

$panos = $con->getElementsByTagName('panorama');

// determine where to put the return hotspot, based on view range
$hookTilt = 90;
$hookPan = 0;
if (($view = $panos->item(0)->getElementsByTagName('view')->item(0) ) &&
($viewStart = $view->getElementsByTagName('start')->item(0)) && 
($viewMax = $view->getElementsByTagName('max')->item(0) ) ) 
{
  $viewPan = $viewStart->getAttribute('pan');
  $viewTilt = $viewStart->getAttribute('tilt');
  $viewPanMax = $viewMax->getAttribute('pan');
  $viewTiltMax = $viewMax->getAttribute('tilt');
  if ($viewTiltMax < 90) {
   $hookTilt = $viewTilt;
   $hookPan = $viewPan + 180;
   if (($hookPan > 360)||($hookPan > $viewPanMax)) $hookPan -=360;
  }
}

$hotspots = $panos->item(0)->getElementsByTagName('hotspots');
$firsthot = $hotspots->item(0)->getElementsByTagName('hotspot')->item(0);
$newhot = $con->createElement('hotspot');

$a1 = $con->createAttribute('title');
$a1->value = 'RETURN TO PARKING LOT';
$newhot->appendChild($a1);
$a2 = $con->createAttribute('url');
$a2->value = 'http://'.$server.$antiTail.'ParkingLotPush.php';
$newhot->appendChild($a2);
$a3 = $con->createAttribute('tilt');
$a3->value = $hookTilt;
$newhot->appendChild($a3);
$a4 = $con->createAttribute('pan');
$a4->value = $hookPan;
$newhot->appendChild($a4);
$a5 = $con->createAttribute('id');
$a5->value = 'ReturnPoint01';
$newhot->appendChild($a5);
$a6 = $con->createAttribute('description');
$a6->value = 'RETURN TO PARKING LOT';
$newhot->appendChild($a6);
$a7 = $con->createAttribute('target');
$a7->value = '';
$newhot->appendChild($a7);
$a8 = $con->createAttribute('skinid');
$a8->value = 'ht_url';
$newhot->appendChild($a8);
$newhotspot = $hotspots->item(0)->insertBefore($newhot);

$modxml = $con->saveXML();
// $modxml = $con->saveXML($newhot);
echo $modxml;

?>
