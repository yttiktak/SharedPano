// expects skinBase skinSrc and loadMe to be set from php
// expects selfTest and maybe bjDebug to be set prior
// depends on pano2vr_player.js
// depends on pusher.js, should fail functional without pusher, though
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
	
var traj= [];
var lastLoc = {'pan':0,'tilt':0,'yaw':0,'fov':0,'time':0};
var leading = !1;
var takeLeadTimeoutId = 0;

var leadFollowDiv = skin.findElements('LeadingFlag')[0];
var statusDiv = skin.findElements('ReportStatus')[0];
var chatDiv = skin.findElements('ChatText')[0];

leadFollowDiv.ggTextDiv.innerText = (leading)?"LEADING0":"following0";

var reportStatus = function(msg) {
	if (typeof statusDiv != 'undefined') ggTextDiv.innerText = msg;
}
var showChatText = function(msg) {
	if (typeof chatDiv != 'undefined') ggTextDiv.innerText = msg;
}
var takeLead = function( lead, offer = Boolean(false), msg = "" ) {
	// manage the state of the 'leading' boolean
	// signal to user they are leading the tour or not
	// to indicate ready to lead, do true,true
	// leading: true, following: false

	if (msg !== "" ) {
		reportStatus(msg);
		console.log("deprecated message path. Ms was: " + msg);
	}

	leadFollowDiv.ggTextDiv.innerText = (lead)?((offer)?"ready":"LEADING"):"following";
	console.log("lead="+lead+" offer="+offer+ " msg="+msg);

	leading = lead;
}

console.log("try to subscribe");
var pusher;
var channel = {};
if (typeof Pusher == 'undefined') { 
	console.log("NO PUSHER");
	channel.subscribed = !1; // there MIGHT be a subscribed field in channel object,but I dont care. Should I?
	pusher = !1;
	takeLead(!1,!0,"not talking");
} else {
	pusher = new Pusher('95b5a3122e42176dd240', {
		encrypted: true,
		authEndpoint: '../_php/pusher_auth.php' // allows anything
	});
	console.log("made a new pusher object");
	console.log(pusher);
	channel = pusher.subscribe('private-channel');
	channel.bind('pusher:subscription_succeeded',function() {
		channel.trigger('client-arrived',{'where':'somewhere'});
		console.log('subscription ok');
		channel.subscribed = !0;
		takeLeadTimeoutId = setTimeout( function() { takeLead( true); }, 15000); 
		// if nothing happening 15 sec after load, I start to lead.
	});
	channel.bind('pusher:subscription_error', function(status) {
		console.log('subscriptioin error');
		channel.subscribed = !1;
	});
	setTimeout(function() {
		console.log("waited 10, stop trying to connect if not connected yet");
		if (channel.subscribed) {
			console.log("Is subscribed. OK, just return");
			return;
		}
		console.log("yup, not subscribed. Try to shut it down");
		console.log(pusher);
		console.log(channel);
		channel.disconnect();// really? Just saw this inside the code, try it.
		takeLead(!1,!0,"no connection");
	},10000);
} // end if-else Pusher (the js loads from their site, might fail)

channel.subscribed = !1; // there is a subscribed field in pusher or channel already, best not to disturb it
console.log(channel);




var goto = function( cord ) {
	// That last number is speed, seems to be inverse seconds?
	// TODO get delta time and use it. Maybe for the last (first?) step default to 2per?
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
		locHist.push(lastLoc);// watch out. Pushed by reference. Saved, cause the assign above disconnects.
	}
}, (selfTest)?3000:100);


//***************  EVERY TWO SECONDS, SEND (or try to) WHAT IVE BEEN DOING ****************//
window.setInterval(function () {

	if (!leading) {
		locHist = [];
		if (bjDebug) console.log("not leading. Just zero out history and return");
		return;
	}
	if (!channel.subscribed){
		if (!selfTest) {
			if (bjDebug) console.log("not subscribed, not self testing. Not gonna send.");
		} else {
			if (bjDebug) console.log("subscribed, but self testing. take lead and pretend send.");
		}
	}

	takeLead( true,true);
	if (locHist.length == 0) {
		if (bjDebug) console.log("lochist length zero. Nothign to send, just return");
		return;
	}
	if (channel.subscribed) {
		if (bjDebug) console.log("subscribed, and something to send, so off it goes");
		channel.trigger('client-traj',{'id':'needs work','traj':locHist});
	}
	if (selfTest) {
		traj = locHist.slice(0);
		unwrap();
		takeLead(false);
	}
	locHist = [];
}, (selfTest)?12000:2000);

// Now I just place js after html. Had been inside the load callback: window.addEventListener("load", function() {


// loadMe is injected via PHP, from query string or just ParkingLotx.xml
// NOTE THE EXPERIMENTAL CHANGE TO A BLOCKING LOAD HERE

// pano.readConfigUrlAsync(loadMe);
pano.readConfigUrl(loadMe);


if (!pusher) {
	console.log("no pusher!!");
} else {
	channel.bind('client-traj',function(data) {
		if (leading) {
			takeLead( false);
		}
		if (takeLeadTimeoutId != 0 ) { clearTimeout(takeLeadTimeoutId); }
		takeLeadTimeoutId = setTimeout( function() { takeLead( true,false); }, 5000);

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
} // end if channel then channel bindings 




