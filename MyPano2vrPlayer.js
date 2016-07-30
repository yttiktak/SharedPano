// MyPlayer.js 
// expects skinBase skinSrc server my_uri and loadMe to be set from php
// depends on pano2vr_player.js
// depends on pusher.js
// depends on ParkingLotPush.js
// dependent on this is MySkin.js for the extension functions
// extends pano2vrPlayer
// Roberta Jane Bennett 5/15/16

function surrogateCtor() {}
function extend(base,sub) {
	surrogateCtor.prototype = base.prototype;
	sub.prototype = new surrogateCtor();
	sub.prototype.constructor = sub;
}
// also use above method to extend existing skin, so I can add the lead/follow flag and other chat.

// as per SO stackoverflow.com/questions/4762254
function navigateToUrl(url) {
    var f = document.createElement("FORM");
    f.action = url;

    var indexQM = url.indexOf("?");
    if (indexQM>=0) {
        // the URL has parameters => convert them to hidden form inputs
        var params = url.substring(indexQM+1).split("&");
        for (var i=0; i<params.length; i++) {
            var keyValuePair = params[i].split("=");
            var input = document.createElement("INPUT");
            input.type="hidden";
            input.name  = keyValuePair[0];
            input.value = keyValuePair[1];
            f.appendChild(input);
        }
    }

    document.body.appendChild(f);
    f.submit();
}

function MyPlayer( container ) {
// NEED TO HANDLE OTHER HOT SPOT EFFECTS, PARTICULARLY THE IMAGE POP-UPS
	my_base = "http://" + server + my_uri.replace(/[^/]*\.php$/i,""); // http://localhost/Output/

			console.log("bjDebug: "+bjDebug);
			console.log("skin_base: "+skinBase);
			console.log("server: "+server);
			console.log("my_uri: "+my_uri);
			console.log("my_base: "+my_base);

	pano2vrPlayer.apply(this,arguments);
	this.readConfigUrlAsync = function( url ) {
		console.log("UrlAsync: "+url); pano2vrPlayer.prototype.readConfigUrlAsync.call(this,url);
	}
	this.readConfigUrl = function( url ) {console.log("Url: "+url); pano2vrPlayer.prototype.readConfigUrl.call(this,url);}
	this.readConfigXml = function( url ) {console.log("Xml: "+url); pano2vrPlayer.prototype.readConfigXml.call(this,url);}	

	this.bj_recent_opened = "";
	this.prepHttpUrl = function( url ) {
		// Outsiders (full urls) get sent as a query string. But back to self, just as is.
		var newUrl;
		if (!url.startsWith(my_base)) {
			newUrl = url.replace(/(^http.*)/i,'?url=$1'); // SANITIZE THIS URL PLEASE
		} else {
			newUrl = url;
		}
		if (newUrl.endsWith('/')) { newUrl = newUrl + 'pano.xml'; } // I guess??
		return newUrl;
	}
	this.prepXMLURL = function( url ) {
		// these are relative urls, need to convert to absolute (http:// etc)
		var newUrl = (skinBase =="")?my_base+url:skinBase+url;
		// and then put them as a query string to my redirector (keyed by readyXml)
		newUrl = my_base + "readyXml/" + newUrl; 
		return newUrl;
	}
	this.prepURL = function( url ) {
		// If relative urls, need to convert to absolute (http:// etc)
		var newUrl = url;
		if (!url.match(/^https?:/)) {
			newUrl = (skinBase =="")?my_base+url:skinBase+url;
		}
		if (newUrl.endsWith('/')) { newUrl = newUrl + 'pano.xml'; } // I guess??
		return newUrl;
	}
	this.prepXmlURL = function( url ) {
		var newUrl = this.prepURL(url);
		// and then put as a query string to my xml redirector (keyed by readyXml)
		newUrl = my_base + "readyXml/" + newUrl; 
		return newUrl;
	}
	this.prepImgURL = function( url ) {
		var newUrl = this.prepURL(url);
		// and then put as a query string to my image redirector (keyed by ready)
		newUrl = my_base + "ready/" + newUrl; 
		return newUrl;
	}
	this.openUrl = function( url, target ) {	// is called from skin.js on a hotspot click

		if (!target.match(/^pushed /)) { // my flag for a change that came from a broadcast)
			if ( channel.subscribed ) { // pusher is running??
				console.log("sending: " +url + " target: pushed " + target);
				channel.trigger('client-teleport',{'uri':url,'target':'pushed '+target});
			}
		}
		target = target.replace(/^pushed /,'');

		if (url.match(/^https?:/)) {
			// Outsiders (full urls) get sent as a query string. But back to self, just as is.
			url = this.prepHttpUrl(url);
			if (bjDebug) {
				console.log("server: "+server);
				console.log("my_uri: "+my_uri);
				console.log("my_base: "+my_base);
				console.log("jump url: "+url);
				alert("waiting to jump");
			}
/***
 NEED TO STOP SELF TEST FROM RUNNING IF I SIMPLY HAVE RETURNED FROM A LINK. OR DO IT MORE DISCREETLY.
***/
			// var timid = setTimeout(function() { window.location.href=url;}, 50);
			// TRY USING navigateToUrl
			var timid = setTimeout(function() { navigateToUrl(url);}, 50);
			// Pusher kills the teleport event if I quit the page too early.
			return;
		}
		if (!url.match(/^{.*}$/i)) { // pass node hop, eg {\d+}, through. Process else, eg xml & swf. 
			// these are relative urls, need to convert to absolute (http:// etc)
			url = this.prepXMLURL(url);
			if (bjDebug) {
				console.log("skin_base: "+skinBase);
				console.log("server: "+server);
				console.log("my_uri: "+my_uri);
				console.log("my_base: "+my_base);
				console.log('skinBased url is now: '+url);
			}
		}

		pano2vrPlayer.prototype.openUrl.call(this,url,target);
		this.bj_recent_opened = url;
	}
	this.getHotspotArray = function() {
		for (var a = [], b = 0; b < this.I.length; b++) {
			var c = this.I[b];
			'point' == c.type && a.push(c)
		}
		return a
	}

}


extend(pano2vrPlayer,MyPlayer); 

/***
need to handle explicit pano defs like the 14ers:

<panorama id=""><view fovmode="0" pannorth="0"><start pan="0" fov="54.81" tilt="0"/><min pan="-180" fov="5" tilt="-27.43951707271129"/><max pan="180" fov="96" tilt="27.43951707271129"/></view><userdata title="" datetime="" description="" copyright="14ers.com" tags="" author="Bill Middlebrook" source="" comment="" info="" longitude="" latitude=""/><hotspots width="180" height="20" wordwrap="1"><label width="180" backgroundalpha="1" enabled="1" height="20" backgroundcolor="0xffffff" bordercolor="0x000000" border="1" textcolor="0x000000" background="1" borderalpha="1" borderradius="1" wordwrap="1" textalpha="1"/><polystyle mode="0" backgroundalpha="0.2509803921568627" backgroundcolor="0x0000ff" bordercolor="0x0000ff" borderalpha="1"/></hotspots><media/><input tile0url="images/crestonepeak_small_0.jpg" prev5url="images/crestonepeak_small_preview_5.jpg" prev4url="images/crestonepeak_small_preview_4.jpg" prev3url="images/crestonepeak_small_preview_3.jpg" prev2url="images/crestonepeak_small_preview_2.jpg" prev1url="images/crestonepeak_small_preview_1.jpg" prev0url="images/crestonepeak_small_preview_0.jpg" tile5url="images/crestonepeak_small_5.jpg" tilesize="1500" tile4url="images/crestonepeak_small_4.jpg" tile3url="images/crestonepeak_small_3.jpg" tilescale="1.006666666666667" tile2url="images/crestonepeak_small_2.jpg" tile1url="images/crestonepeak_small_1.jpg"/><control simulatemass="1" lockedmouse="0" lockedkeyboard="0" dblclickfullscreen="0" invertwheel="0" lockedwheel="0" invertcontrol="1" speedwheel="1" sensitivity="18"/></panorama>

See? tile0url .. tile5url, prev5url .. prev0url, tilesize, tilescale


***/

