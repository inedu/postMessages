// 1. put the code to both DOMs (window + iFrame)
// 2. run both frameTalk.init()
// sendMessage first param must be a window object. Try .contentWindow for iFrames
// **** send example: frameTalk.sendMessage( window.top, "doRunFn", [1,2,3,'four'] );

(function (window) {
    "use strict";
    var frameTalk, hasBeenInit = false;    
	
	frameTalk = {
        init : function() {
			if (! (window.JSON && window.JSON.parse && window.JSON.stringify)) {
                say("No init, JSON missing, please load JSON2");
				return;
            }		
			if (!hasBeenInit) {
				if (window.addEventListener) {
					window.addEventListener("message", receiveMessage, false); 
					hasBeenInit = true;
				} else if (window.attachEvent) {
					window.attachEvent("onmessage", receiveMessage);   
					hasBeenInit = true;					
				} else { say("could not attach event listener"); }
			} else { say("already init"); }
        },		 
		
		sendMessage : function (where, theFunction, theParams) {
            try {
				if (typeof theFunction != "string" ) {
					say("sendMessage second param must be a function's name (string)");
					return;
				}
				if (typeof where != "object" || !where.postMessage ) {
					say("sendMessage first param must be a window object with postMessage defined. Try .contentWindow for iFrames");
					return;
				} 
				if (typeof theParams != "object" ) {
					// turn theParams into single record array
					theParams = [theParams];
				}
                // some browsers do not support json via postMessage, so stringify                                   
                var myMsgObj = {"theFunction":theFunction, "theParams":theParams};
				var myMsg = window.JSON.stringify(myMsgObj);
                where.postMessage(myMsg, '*');
            } catch (err) {
                say("sendMessage Error - description: " + err.message);        
            }
        },
		 
        handshake : function (toWindow) {
			var windowFromName;
			if ( typeof toWindow != "object" || !toWindow.postMessage ) {
				say('handshake needs a window object with postMessage defined');
				return; 
			}
			if (window.top === window) {
				// handshake starts from top window
				windowFromName = "@@top@@"; 
			} else {
				windowFromName = window.name;
			}
			frameTalk.sendMessage(toWindow, "handshake", [windowFromName]);
		}
    };    

	function receiveMessage (event) {
		try {
			// sendMessage always sends a string, so, turn it into json
			var eventObjData = window.JSON.parse(event.data),
				theFunction = eventObjData.theFunction,
				theParams = eventObjData.theParams,
				wObj;
			//
			if (theFunction == "handshake") { 
				var windowNameToReply = theParams[0]; 
				if (windowNameToReply === "@@top@@") {
					wObj = window.top;
					frameTalk.sendMessage(wObj, { "theFunction": "replyHandshake", "theParams": [0] });
				} else {
					wObj = window.document.getElementById(windowNameToReply);					
					if ( wObj && wObj.contentWindow ) {
						// it's an iFrame. Put [1] in params
						frameTalk.sendMessage(wObj.contentWindow, { "theFunction": "replyHandshake", "theParams": [1] });
					} else {
						// it's not the top window nor an iFrame in this window. Look for iFrames in parent (nested case)
						wObj = window.parent.document.getElementById(windowNameToReply);
						if ( wObj && wObj.contentWindow ) {
							frameTalk.sendMessage(wObj.contentWindow, { "theFunction": "replyHandshake", "theParams": [1] });
						} else {
							say("could not find handshake receiver");
						}
					}
				}				 
			}  
			if (theFunction == "replyHandshake") {           
				if (theParams[0] === 0) { 
					say("HandShake with top window completed." ); 
				} else {
					say("HandShake completed." ); 
				}
			}                  
			else {
				// call the function that other iFrame asked to
				var fn = window[theFunction];
				fn.apply(this, theParams);
			}
		} catch (err) {
			say("receiveMessage Error - description: " + err.message);        
		}
	}	
	
	function say(what){	console.log("frameTalk says: " + what);	}
	   
  window.frameTalk = frameTalk;
}(window));
