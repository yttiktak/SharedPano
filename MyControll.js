// expects skinBase skinSrc and loadMe to be set from php
// depends on pano2vr_player.js
// depends on pusher.js
// depends on MyPano2vrPlayer.js
// depends on skin.js or definition of pano2vrSkin
// extends pano2vrPlayer
// depends on MySkin.js
// Roberta Jane Bennett 5/15/16

if (typeof pano2vrSkin =='undefined') {console.log('FAIL. Need a skin via pano2vrSkin');alert('script error')};

if (typeof skinSrc == 'undefined') {console.log('skin source not defined');skinSrc = 'skin.js'};
if (typeof skinBase == 'undefined') {console.log('skin base not defined');skinBase = ''};
if (typeof loadMe == 'undefined') {loadMe = 'ParkingLotx.xml';console.log('loadMe not defined')};


pano=new MyPlayer("container");

  // If falling back on my skin, do not use their base url.
skin = new MySkin(pano,(skinSrc !== "skin.js")?skinBase:""); 

gyro=new pano2vrGyro(pano,"container"); // bobby some do some do not. Do I need to check?
	
var selfTest = Boolean(false);	// seems a var I set in channel was testing true. Why?
var traj= [];
var lastLoc = {'pan':0,'tilt':0,'yaw':0,'fov':0,'time':0};
var leading = Boolean(false);
var timeoutid = 0;
var leadFollowDiv = skin.findElements('LeadingFlag')[0];
leadFollowDiv.ggTextDiv.innerText = (leading)?"LEADING0":"following0";


var takeLead = function( lead, offer = Boolean(false) ) {
	// signal to user they are leading the tour or not
	leadFollowDiv.ggTextDiv.innerText = (lead)?((offer)?"ready":"LEADING"):"following";
	leading = lead;
}
timeoutid = setTimeout( function() { takeLead( true); }, 15000); 
// if nothing happening 15 sec after load, I start to lead.

var goto = function( cord ) {
	// That last number is speed, seems to be inverse seconds?
	pano.moveTo(cord.pan,cord.tilt,cord.fov,2);
}
var unwrap = function() { // need to compute delay times based on recorded times.
	if (traj.length == 0 ) return;
	var cord = traj.shift();
	goto(cord);
	if (traj.length == 0 ) return;
	var delt = traj[0].time - cord.time;
	window.setTimeout(unwrap,delt);
}
window.setInterval(function () {
	if (!leading) return;
        panval = pano.getPan();
	tiltval = pano.getTilt();
	yawval = pano.getRoll(); 
	fovval = pano.getFov();
	var d = new Date();
	time = d.getTime();
	if ((lastLoc.pan!==panval)|(lastLoc.tilt!==tiltval)|(lastLoc.yaw!==yawval)|(lastLoc.fov!==fovval)) {
		lastLoc =  {'pan':panval,'tilt':tiltval,'yaw':yawval,'fov':fovval,'time':time};
		locHist.push(lastLoc);// watch out. Pushed by reference. Saved, cause above disconnects.
	}
}, (selfTest)?3000:100);

window.setInterval(function () {

	if (!leading) {
		locHist = [];
		return;
	}
	takeLead( true,true);
	if (locHist.length == 0) return;
	if ((typeof channel !== 'undefined')&&(channel.subscribed)) {
		channel.trigger('client-traj',{'id':'needs work','traj':locHist});
	}
	if (selfTest) {
		traj = locHist.slice(0);
		unwrap();
		takeLead(false);
	}
	locHist = [];
}, (selfTest)?12000:2000);

// all had been inside this. Now, just place js after html. window.addEventListener("load", function() {

pano.readConfigUrlAsync(loadMe);// loadMe is injected via PHP, from query string or just ParkingLotx.xml

console.log("subscribe");
// var subscribed = false;
var pusher = new Pusher('95b5a3122e42176dd240', {
	encrypted: true,
	authEndpoint: '../_php/pusher_auth.php' // allows anything
});
var channel = pusher.subscribe('private-channel');
channel.subscribed = Boolean(false);

channel.bind('pusher:subscription_succeeded',function() {
	var triggered = channel.trigger('client-arrived',{'where':'somewhere'});
	console.log('subscription ok');
	channel.subscribed = Boolean(true);
});
channel.bind('pusher:subscription_error', function(status) {
	console.log('subscriptioin error');
	channel.subscribed = Boolean(false);
});



if (typeof channel !== 'undefined') {
	channel.bind('client-traj',function(data) {
		if (leading) {
			takeLead( false);
		}
		if (timeoutid != 0 ) { clearTimeout(timeoutid); }
		timeoutid = setTimeout( function() { takeLead( true,false); }, 5000);

		console.log('new trajectory');
		traj = data.traj.slice(0);
		console.log(traj);
		unwrap();
	});
	channel.bind('client-teleport',function(data) {
		// var triggered = channel.trigger('client-ack',{'event':'teleport','data':data});
		console.log('teleport');
		console.log(data);
		pano.openUrl(data.uri,data.target);
	});
	//channel.bind('client-ack',function(data) {});

	var popups = skin.findElements("image_popup");
	var popupDiv = (popups)?popups[0]:null;

	if (popupDiv) popupDiv.addEventListener('click',function() {
		console.log('popup clicked'); // ok up to here.
		if ((typeof popupDiv.remote != "undefined")&&(popupDiv.remote)) {
			console.log('echo'); return;
		}
		if (channel.subscribed) {
			channel.trigger('client-hotspot',{'event':'close popup'});
		}
	},false);

	// handle channel.trigger('client-hotspot',{'event':'over'|'out'|'click'|'close popup','id':id});
	channel.bind('client-hotspot',function(data) {
		if (data.event == "close popup") {
			popupDiv.remote = true;
			popupDiv.onclick();
			return;
		}
		var hitten = pano.getHotspot(data.id);
		hitten.div.setAttribute('data-remote','1'); 
		// Flag indicates the next click is from the remote.
		console.log(hitten); // ah HA.
		if (typeof hitten !== 'undefined') {
			switch (data.event) {
				case 'click': hitten.div.onclick(); break;
				case 'over': hitten.div.onmouseover(); break;
				case 'out': hitten.div.onmouseout(); break;
			}
		}
	});
	// locate the popup hotspot 
} // channel bindings 




