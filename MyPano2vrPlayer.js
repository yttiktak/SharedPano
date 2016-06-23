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

function MyPlayer( container ) {
// NEED TO HANDLE OTHER HOT SPOT EFFECTS, PARTICULARLY THE IMAGE POP-UPS
	my_base = "http://" + server + my_uri.replace(/[^/]*\.php$/i,"");; // http://localhost/Output/

	pano2vrPlayer.apply(this,arguments);
	this.readConfigUrlAsync = function( url ) {
		console.log("UrlAsync: "+url); pano2vrPlayer.prototype.readConfigUrlAsync.call(this,url);
	}
	this.readConfigUrl = function( url ) {console.log("Url: "+url); pano2vrPlayer.prototype.readConfigUrl.call(this,url);}
	this.readConfigXml = function( url ) {console.log("Xml: "+url); pano2vrPlayer.prototype.readConfigXml.call(this,url);}	

	this.bj_recent_opened = "";
	this.openUrl = function( url, target ) {	// is called from skin.js on a hotspot click
		/*** TODO the cave people starting page seems to escape my xml re-write. Need to detect that, and 
		append the proxy url if needed.
		***/
		console.log("OpenUrl: " +url + " target: " + target);

		if (!target.match(/^pushed /)) { // my flag for a change that came from a broadcast)
			if ( channel.subscribed ) { // maybe pusher failed some other way.
				console.log("sending: " +url + " target: pushed " + target);
				channel.trigger('client-teleport',{'uri':url,'target':'pushed '+target});
			}
		}
		target = target.replace(/^pushed /,'');

		if (url.match(/^https?:/)) {
		// so, outsiders get sent to me as a query string, but if back to self, just as is.
			if (!url.match(/ParkingLotPush\.php/i)) { // Oughta identify self url, not hard code it like this.
				url = url.replace(/(^http.*)/i,'?url=$1'); // SANITIZE THIS URL PLEASE
			}
			if (bjDebug) { console.log('In 10 sec going to '+url); }
			var timid = setTimeout(function() { window.location.href=url;}, (bjDebug)?10000:50);
			// Mystery. Was pusher killing the teleport event when I quit the page too early?
			return;
		}
		if (!url.match(/^{.*}$/i)) { // pass node hop, eg {\d+}, through. Process else 
			url = (skinBase =="")?my_base+url:skinBase+url;
			url = my_base + "readyXml/" + url; // ?? 
			console.log('skinBased url is now: '+url);
		}
		pano2vrPlayer.prototype.openUrl.call(this,url,target);
		this.bj_recent_opened = url;
	}
}


extend(pano2vrPlayer,MyPlayer); 



