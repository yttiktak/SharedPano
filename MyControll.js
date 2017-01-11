// expects haveBeenHere, skinBase skinSrc and loadMe to be set from php
// expects selfTest and maybe bjDebug to be set prior
// depends on pano2vr_player.js
// depends on pusher.js, should fail functional without pusher, though. Just no shared navigation.
// depends on MyPano2vrPlayer.js
// depends on skin.js or definition of pano2vrSkin
// extends pano2vrPlayer
// depends on MySkin.js
// Roberta Jane Bennett 5/15/16

// NEED TO ADDRESS GYRO INPUT DEVICES TAKING OVER LEAD AND JUMPING TO THEIR ORIENTATION

if (typeof pano2vrSkin =='undefined') {console.log('FAIL. Need a skin via pano2vrSkin');alert('script error')};

if (typeof skinSrc == 'undefined') {console.log('skin source not defined');skinSrc = 'skin.js'};
if (typeof skinBase == 'undefined') {console.log('skin base not defined');skinBase = ''};
if (typeof loadMe == 'undefined') {loadMe = 'ParkingLotx.xml';console.log('loadMe not defined')};


pano=new MyPlayer("container");


skin = new MySkin(pano,(skinSrc !== "skin.js")?skinBase:""); 
  // If falling back on my skin (because the outside link has none), do not use their base url.

gyro=new pano2vrGyro(pano,"container"); // Some do gyro, some do not. Do I need to check?
	
var traj= []; 				// Received trajectory; a point every 0.1 sec for apx the last second.
var locHist = [];			// Record my trajectory here, if I am leading.
var lastLoc = {'pan':0,'tilt':0,'yaw':0,'fov':0,'time':0};
var leading = !1;			// Flag indicating who in the group has the lead, controlls the view.
var takeLeadTimeoutId = 0;

// some useful locations in the DOM:
var leadFollowDiv = skin.findElements('LeadingFlag')[0];	// Added via MySkin
leadFollowDiv.ggTextDiv.innerText = (leading)?"LEADING0":"following0";
var statusDiv = skin.findElements('ReportStatus')[0];		// Added via MySkin
var chatDiv = skin.findElements('ChatText')[0];			// Added via MySkin
var imagePopup = skin.findElements('image_popup')[0];		// Expected to be in skin.js
var informationPopup = skin.findElements('information')[0];	// Expected to be in skin.js
var infoCloseButton = skin.findElements('ht_info_close')[0];	// Expected to be in skin.js


var reportStatus = function(msg) {
	if (typeof statusDiv != 'undefined') {
		statusDiv.ggTextDiv.innerText = msg;
	} else {
		console.log("status: "+msg);
	}
}
var showChatText = function(msg) {
	if (typeof chatDiv != 'undefined') {
		statusDiv.ggTextDiv.innerText = msg;
	} else {
		console.log("chat: "+msg);
	}
}
var takeLead = function( lead, offer = !1) {
	// manage the state of the 'leading' boolean
	// signal to user they are leading the tour or not
	// to indicate ready to lead, do true,true (and false,true if no socket)

	if (offer) {
		leadFollowDiv.ggTextDiv.innerText = (lead)?"ready":"no socket";
	} else {
		leadFollowDiv.ggTextDiv.innerText = (lead)?"LEADING":"following";
	}

	console.log("lead="+lead+" offer="+offer);

	leading = lead;
}

/*** BEGIN SETTING UP THE WEBSOCKETS USING PUSHER
 Note this requires a SUBSCRIPTION to Pusher.
 The plan is, that folk can easily join the web-ring, simply add
 (or allow to be added) their links. No need to host the page, in
 fact I haven't set up to share with other incarnations. Should consider 
 how to do that.
***/
var pusher;
var channel = {};
if (typeof Pusher == 'undefined') { 
	console.log("NO PUSHER");
	channel.subscribed = !1; // there MIGHT already be a subscribed field in channel object,but I dont care. Should I?
	pusher = !1;
	takeLead(!1,!0);
} else {

	pusher = new Pusher('95b5a3122e42176dd240', {
		encrypted: true,
		authEndpoint: '../_php/pusher_auth.php' // allows anything. BJ !! Gotta set up limits here.
	});
	console.log("made a new pusher object");
	console.log(pusher);

	channel = pusher.subscribe('private-channel');
	var connectionResetTimer = setTimeout(function() {
		if (channel.subscribed) { return;}
		console.log("Yup, not subscribed. Try to shut it down");
		reportStatus("no socket");
		channel.disconnect();// really?? Just saw this inside the code, try it.
		takeLead(!1,!0);
	},10000);
	channel.bind('pusher:subscription_succeeded',function() {
		channel.trigger('client-arrived',{'where':'somewhere'});
		reportStatus('subscription ok');
		channel.subscribed = !0;
		clearTimeout(connectionResetTimer);
		// if nothing happening 15 sec after load, I start to lead.
		takeLeadTimeoutId = setTimeout( function() { takeLead( true); }, 15000); 
	});
	channel.bind('pusher:subscription_error', function(status) {
		console.log('subscriptioin error');
		reportStatus("socket error");
		clearTimeout(connectionResetTimer);
		channel.subscribed = !1;
	});

} // end if-else Pusher (the js loads from their site, might fail)

channel.subscribed = !1; // there is a subscribed field in pusher or channel already, disturbs it.
console.log(channel);


//*************** TRAJECTORY MANAGEMENT ****************//

// goto and unwrap for playing back trajectory. Expected to have been transmitted by the leader.
var goto = function( cord ) {
	// That last number is speed, seems to be inverse seconds?
	// TODO get delta time and use it. Maybe for the last (first?) step default to 2per?
	pano.moveTo(cord.pan,cord.tilt,cord.fov,2);
}
var unwrap = function() {
	if (traj.length == 0 ) return;
	var cord = traj.shift();
	goto(cord);
	if (traj.length == 0 ) return;
	var delt = traj[0].time - cord.time;
	window.setTimeout(unwrap,delt);
}

// If I am leader, I record my trajectory 10 per second.
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


//***************  EVERY TWO SECONDS, SEND WHAT IVE BEEN DOING IF I AM LEADER ****************//
window.setInterval(function () {

	if (!leading) {
		locHist = [];
		if (bjDebug) console.log("not leading. Just zero out history and return");
		return;
	}
	if (!channel.subscribed){
		if (!selfTest) {
			if (bjDebug) console.log("not subscribed, not self testing. Not gonna send.");
			return;
		} else {
			if (bjDebug) console.log("subscribed, but self testing. take lead and pretend send.");
		}
	}

	takeLead( !0,!0); // eg, offer to lead
	if (locHist.length == 0) {
		if (bjDebug) console.log("lochist length zero. Nothing to send, just return");
		return;
	}

	if (bjDebug) console.log("subscribed, and something to send, so off it goes");
	channel.trigger('client-traj',{'id':'subscriber id needs work','traj':locHist});

	if (selfTest) {
		traj = locHist.slice(0);
		unwrap();
		takeLead(!1);
	}
	locHist = [];
}, (selfTest)?12000:2000);

// JS after html. Had been inside the load callback: window.addEventListener("load", function() {


/*** SOME TESTING AND VERIFYING CODE
 Test each link in this pano. 
  Put 'em in a stack, unwrap the stack recursively, to get 
  a delay between each test.
***/
var failedLinks = [];
var numberOfLinks = 0;
var numberOfLinksTested = 0;

var testLink = function( e ) {
	// e.url could be https?://.*(\.swf|\.html|\.xml)|{.*}|(\.swf|\.xml)
	var url = e.url;
	var fov = pano.getFov();
	pano.moveTo(e.pan,e.tilt,fov,20);
	var link_ok = !0;
	numberOfLinks +=1;
	switch (e.skinid) {
		case "ht_info":
			link_ok = !0;
			numberOfLinksTested +=1;
		break;
		case "ht_image":
		case "ht_url":

			if ( url.match(/^{.*}$/i)) { 
				numberOfLinksTested +=1;
				return !0; 
			}
			if (e.skinid == "ht_image") {
				url = pano.prepImgURL(url);			
			} else {
				url = pano.prepXmlURL(url);
			}
			var http = new XMLHttpRequest();
  			http.open('HEAD', url);
			http.onreadystatechange = function() {
				var DONE = this.DONE || 4;
				if (this.readyState === DONE){
					// check for error
					if (this.status < 300) {
						numberOfLinksTested +=1;
					} else {
						console.log(this.responseURL);
						console.log("failed with "+this.status);
						failedLinks.push(this.responseURL);
						reportStatus(this.responseURL+"\n failed");
						numberOfLinksTested +=1;
					}
				}
			}
   			http.onload = function() {};
   			http.onerror = function() {
				console.log("ERROR in request");
				console.log(this.responseURL);
				console.log("failed");
				failedLinks.push(this.responseURL);
				reportStatus(this.responseURL+"\n FAILED");
				numberOfLinksTested +=1;
    			};
    			http.send();
		break;
		default: numberOfLinksTested +=1;
	}
	return link_ok;
}
var linkStack = [];
var unwrapLinkStack = function() {
	// if uwrap done, report results
	if (linkStack.length == 0) { 
		console.log('testing stack unwrapped');
		if (failedLinks.length > 0) {
			console.log("LINK ERRORS. Here is the stack: ");
			console.log(failedLinks);
			for (var ln=0; ln < failedLinks.length; ln++) {
				console.log(failedLinks[ln]);
			}
		}
		return; 
	}
	// pop off a test item, test it, delay for next.
	var e = linkStack.pop();
	if ((typeof e.url != "undefined")&&(e.url != "")) {
		testLink(e);
		window.setTimeout(unwrapLinkStack,1000);
	} else {
		window.setTimeout(unwrapLinkStack,100);
	}
}
var testEachLink = function() {
	if (linkStack.length != 0) { console.log('already RUNNING test'); return; }
	if (haveBeenHere) { console.log("already been here"); return; } 
	linkStack = me.player.getHotspotArray();
	unwrapLinkStack();
}
/*** last test:
Array [ "http://localhost/Output/ready/http:…", "http://localhost/Output/readyXml/ht…" ] MyControll.js:268:4
"http://localhost/Output/ready/http://localhost/Output/images/IMG_0817.JPG" MyControll.js:270:5
changed to use advert.jpg
"http://localhost/Output/readyXml/http://13ers.com/pano.xml"


***/

// loadMe is injected via PHP, from query string or just ParkingLotx.xml
// NOTE THE EXPERIMENTAL CHANGE TO A BLOCKING LOAD HERE
// darn, forgot why now. Whatever the reason, it should be addressed with an onLoaded callback or promise,
// and not with a blocking load like this.

// pano.readConfigUrlAsync(loadMe);
pano.readConfigUrl(loadMe);

reportStatus("Testing. Stand by");
window.setTimeout(testEachLink,10000); // wait for the socket timeout check first. Nicer console messages that way.

console.log("referer: "+referer);
console.log("have been here: " + haveBeenHere);

if (!pusher) {
	console.log("no pusher!!");
} else {
	channel.bind('client-traj',function(data) {
		if (leading) {
			takeLead( !1);
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


// SET HOOKS IN THE POP UPS IN THE SKIN

/** these worked 
infoCloseButton.addEventListener("click",function(){ },false);
imagePopup.addEventListener("click",function(){ },false);
var imagePopup = skin.findElements('image_popup')[0];
var informationPopup = skin.findElements('information')[0];
var infoCloseButton = skin.findElements('ht_info_close')[0];
**/
	if (typeof imagePopup != 'undefined' ) imagePopup.addEventListener('click',function(e) {
		console.log('popup clicked'); // ok up to here.
		console.log(imagePopup);
		console.log(e);
		if ((typeof imagePopup.remote != "undefined")&&(imagePopup.remote == 1)) {
			console.log('echo. Clicked via remote trigger'); return;
		}
		if (channel.subscribed) {
			channel.trigger('client-popup',{'type':'image_popup','event':'click'});
		}
	},false);
	if (typeof infoCloseButton != 'undefined' ) infoCloseButton.addEventListener('click',function(e) {
		console.log('info close button clicked'); // ok up to here.
		console.log(infoCloseButton);
		console.log(e);
		if ((typeof infoCloseButton.remote != "undefined")&&(infoCloseButton.remote == 1)) {
			console.log('echo. Clicked via remote trigger'); return;
		}
		if (channel.subscribed) {
			channel.trigger('client-popup',{'type':'ht_info_close','event':'click'});
		}
	},false);
	// handle channel.trigger('client-popup',{'type':'ht_info_close'|'image_popup','event':'click'});
	// MUST SORT OUT, EITHER USE data-remote attribute OR ADD A FIELD TO THE OBJECT, .remote
	channel.bind('client-popup',function(data) {
		switch (data.type) {
			case 'ht_info_close': 
				console.log('rcd info close');
				if (typeof infoCloseButton != 'undefined' ) {
					infoCloseButton.remote = 1;
					infoCloseButton.onclick();
				}
				break;
			case 'image_popup':				
				console.log('rcd image close');
				if (typeof imagePopup != 'undefined' ) {
					imagePopup.remote = 1;
					imagePopup.onclick();
				}
				break;
			default :
		}
	});

	// handle channel.trigger('client-hotspot',{'event':'over'|'out'|'click'|'close popup','id':id});
	channel.bind('client-hotspot',function(data) {
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




