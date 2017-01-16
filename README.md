# SharedPano
VR panos need to connect! I want to stay in the VR, and navigate to other people's places. VR panos are very closed in, right now. At the least, VR web rings ought to be happening: like minded content creators adding VR links to each other within their worlds. What I am doing here is more equivalent to putting outside content into an i-frame, though.

And they need to be a shared experience. I want to visit a place -with- people, we all should see the same view. 

Panorama VR from Garden Gnome software makes a panorama into a VR experience. One can construct a network of leap points
to other points of view, other panoramas, BUT Only within your own VR world. 

I extend the GG software a bit to allow links to outside panos, other person's VR, without leaving the context of the originating VR world. 
This requires a 'proxy' setup, to allow the outside VR media (images) into my local client. A bit messy, but there it is.
Messy, and not terribly polite, as I bypass the outsider's viewer for the most part, and simply access their data.
Not terribly polite, and somewhat fragile, as the outsider, once aware of the access, can easily shut me out with a slight change of permissions.

I also extend it to track each viewers viewpoint, and in this version, choose oneleader who's viewpoint is transmitted to everyone else online at the time. This uses 'pusher' for the websockets.

The outsider's link file has a return link appended to it when loaded into the local viewer, so the viewer can navigate back to where they came from.
