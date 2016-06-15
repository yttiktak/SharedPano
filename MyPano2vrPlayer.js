// MyPlayer.js 
// expects skinBase skinSrc and loadMe to be set from php
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
	pano2vrPlayer.apply(this,arguments);
	this.readConfigUrlAsync = function( url ) {
		console.log("UrlAsync: "+url); pano2vrPlayer.prototype.readConfigUrlAsync.call(this,url);
	}
	this.readConfigUrl = function( url ) {console.log("Url: "+url); pano2vrPlayer.prototype.readConfigUrl.call(this,url);}
	this.readConfigXml = function( url ) {console.log("Xml: "+url); pano2vrPlayer.prototype.readConfigXml.call(this,url);}	

	this.bj_recent_opened = "";
	this.openUrl = function( url, target ) {	// is called from skin.js on a hotspot click
		console.log("OpenUrl: " +url + " target: " + target);

		if (!target.match(/^pushed /)) { // my flag for a change that came from a broadcast)
			if (typeof channel !== 'undefined') { // maybe pusher failed some other way.
				if (channel.subscribed) {
				console.log("sending: " +url + " target: pushed " + target);
				channel.trigger('client-teleport',{'uri':url,'target':'pushed '+target});
				}
			}
		}
		target = target.replace(/^pushed /,'');

		if (url.match(/^http.*/)) {
		// so, outsiders get sent to me as a query string, but if back to self, just as is.
			if (!url.match(/ParkingLotPush\.php/i)) { // Oughta identify self url, not hard code it like this.
				url = url.replace(/(^http.*)/i,'?url=$1');
				// SANITIZE THIS URL PLEASE
			}
			var timid = setTimeout(function() { window.location.href=url;}, 50);
			// Mystery. Was pusher killing the teleport event when I quit the page too early?

			return; // It needs this return, or it seemed to
			// maybe exit or something, even better??
			// script should stop here, as the window is re-loaded. Any worries about pending timeouts ??
		}
		if (!url.match(/^{.*}$/i)) {
			url = skinBase + url;
			console.log('skinBased url is now: '+url);
		}
		pano2vrPlayer.prototype.openUrl.call(this,url,target);
		this.bj_recent_opened = url;
	}
}


extend(pano2vrPlayer,MyPlayer); 



