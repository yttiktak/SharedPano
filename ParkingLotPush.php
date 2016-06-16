<?php
  session_start();
  session_regenerate_id();
  $nonce = 'n'.rand(1000,9999).'n'; // what, I should set up sha hash key pairs and all??
  $_SESSION['nonce'] = $nonce;

  $path = '../_php';
  set_include_path(get_include_path() . PATH_SEPARATOR . $path);
  require('Pusher.php'); // so, on /usr/share/php it is??

  // might want to implement some subscriber verify here, but just not up to it yet.
  // meanwhile, re-laoding must change skin, so add a skin param:
  $outsider = (isset($_GET['url']))?$_GET['url']:"";
  $requested = "";
  // crude hardcoded vetting of the requested url
  // in preparation for a whitelist document to test against. 
  // could even just grep the current ParkingLotx.xml for the url .. but that would limit the range to one step away.
  switch ($outsider) {
   case "https://margaretbazura.com/panos/garnerville3/pano.xml" :
    $requested = "https://margaretbazura.com/panos/garnerville3/pano.xml";
   break;
   default: // no vetting, testing
    $requested = $outsider;
  }
  $skinBase = preg_replace('/[^\/]*\.(xml|php|html)$/i','',$requested); // remove 'stuff.xml' from the url
  // $skinBase = preg_replace("/pano\.xml/","",$requested);
  $_SESSION['skinBase'] = $skinBase;
  $skinSrc = $skinBase."skin.js";
  // if no skin on the remote, must use  mine, to get to my over-rides
  if ($skinBase !=="") {
   $headers = @get_headers($skinSrc);
   if (strpos($headers[0],'404')) { 	// this will block the rest of my page until remote returns with hdr!
    $skinSrc = "skin.js";		// I could do a pre-test, maybe, on the calling page, and indicate in the Query what to do 
   }
  }
?>
<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" /> 
		<title>Tracking Pano-vr Experience Ring</title>
		<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="apple-mobile-web-app-status-bar-style" content="black" />
		<meta name="mobile-web-app-capable" content="yes" />		
		<style type="text/css" title="Default">
			body, div, h1, h2, h3, span, p {
				font-family: Verdana,Arial,Helvetica,sans-serif;
			}
			/* fullscreen */
			html {
				height:100%;
			}
			body {
				height:100%;
				margin: 0px;
				overflow:hidden; /* disable scrollbars */
				font-size: 10pt;
			}
			/* fix for scroll bars on webkit & >=Mac OS X Lion */ 
			::-webkit-scrollbar {
				background-color: rgba(0,0,0,0.5);
				width: 0.75em;
			}
			::-webkit-scrollbar-thumb {
    			background-color:  rgba(255,255,255,0.5);
			}
		</style>
		<script src="https://js.pusher.com/3.0/pusher.min.js"></script>
	</head>
	<body>
		<div id="container" style="width:100%;height:100%;">
			<br>Loading...<br><br>This content requires HTML5 with CSS3 3D Transforms or WebGL.
		</div>
		<script type="text/javascript" src="pano2vr_player.js"></script>
		<script type="text/javascript" src=<?php echo '"'.$skinSrc; ?>"></script>
		<script type="text/javascript" src="pano2vrgyro.js"></script>
		<script> // INJECTING SOME PHP VARS
			requested = <?php echo '"'.$requested; ?>";
			skinBase = <?php echo '"'.$skinBase; ?>"; //requested.replace(/pano\.xml$/,""); // if blank, then blank, right??
			skinSrc =  <?php echo '"'.$skinSrc; ?>"; // skinBase + "skin.js";
			loadMe =  (requested=="")?"ParkingLotx.xml":"readyXml/" + requested;
			nonce = <?php echo '"'.$nonce;?>";
			// de-ja vu happening here. A tinge of self doubt at its tail. Odd.
		</script>
		<script type="text/javascript" src = "MyPano2vrPlayer.js"></script>
		<script type="text/javascript" src = "MySkin.js"></script>
		<script type="text/javascript" src = "MyControll.js"></script>

		<noscript>
			<p><b>Please enable Javascript!</b></p>
		</noscript>
		<!-- Hack needed to hide the url bar on iOS 9, iPhone 5s --> 
		<div style="width:1px;height:1px;"></div>
	</body>
</html>
