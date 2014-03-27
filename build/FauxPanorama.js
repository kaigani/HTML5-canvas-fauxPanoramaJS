// 
// FauxPanorama.js - Intro
//

// GLOBAL methods & variables

window.desktop = false;

// shim layer with setTimeout fallback - doesn't seem to outperform setInterval though...
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

// Version
// - update the version for mobile device debugging
// - sometimes the cache won't clear
window.version = 1.0;

// 
// START CLOSURE
//

(function(window){

// For building with CodeKit ( see https://incident57.com/codekit/ )

// @codekit-append “Preloader.js”
// @codekit-append “OrientationDevice.js”
// @codekit-append “Viewport.js”
// @codekit-append “FauxPanorama.js”

// @codekit-append “_outro.js”



;
//
// Preloader class
// 

var Preloader = function(){

	// Private
	var that = this;
	var queue = []; // load queue
	var count = 0;
	var assets = {}; // for lookup

	// Public 
	this.callback = function(){}; // default callback;

	this.add = function(id,src){
		queue.push( { id:id, src:src } );
		count++;
	};

	this.load = function(){

		console.log("Loading ["+queue.length+"] "+count+" images.");

		for(var i=0; i<queue.length;i++){

			var o = queue[i];

			var img = new Image();
			img.onload = callbackCountdown;
			img.src = o.src;

			assets[o.id] = img;
		}
	};

	var callbackCountdown = function(){

		count--;
		if(count === 0){
			that.callback.call(); // call the callback
		}
	};

	this.callback = function(){
		// default callback
		console.log('No preloader callback defined.');
	};

	this.getById = function(id){

		return assets[id];
	};

};


;
//
// OrientationDevice class
//


// Class definition
var OrientationDevice = function(){

	var that = this;

	this.isPaused = false;
	this.isLandscape = true;

	this.tiltLR = 0;	// left-to-right in degrees, where right is positive, z-rotation or Roll
	this.tiltFB = 0;	// front-to-back in degrees, where front is positive, x-rotation or Pitch
	this.direction = 0;	// compass direction, y-rotation or Yaw

	this.pitch = 0; // corrected for orientation & fixed 0-180
	this.roll = 0; // corrected for orientation -- left roll negative, right roll positive

	this.callback = null;

	// orientation handler
	var deviceOrientationHandler = function(e){

		if(!e.alpha){
			console.log("Device orientation not fully supported.");
			window.desktop=true;
			that.pause();
			return;
		}

		that.tiltLR = e.gamma;	// [-180,180] -- not per spec!
		that.tiltFB = e.beta;	// [-90,90] -- not per spec!
		that.direction = 360-e.alpha; // correction for direction of the x-axis

		that.isLandscape = (window.innerWidth > window.innerHeight);

		// Correct for landscape / portrait orientation
		if(that.isLandscape){
			that.pitch = Math.abs(e.gamma);
		}else{
			// Strange iOS things happening here in portrait - gamma value jumps!
			if(Math.abs(e.gamma < 90)){
				that.pitch = Math.abs(e.beta);
			}else{
				that.pitch = 180-Math.abs(e.beta);
			}
		}

		// These don't work
		//that.pitch = (that.isLandscape) ? Math.abs(e.gamma) : Math.abs(e.beta);
		//that.roll  = (that.isLandscape) ? -1*e.beta : e.gamma;

		that.pitch = 180-that.pitch; // another correction for the direction of the y-axis 

		// To attach an additional callback to the event after OrientationDevice has updated
		if(that.callback){
			that.callback.call();
		}
	};

	// Set orientation event listener
	if (window.DeviceOrientationEvent) {

		window.addEventListener('deviceorientation', deviceOrientationHandler, false);

	}else{
		console.log('Device orientation not supported in this browser.');
	}

	this.pause = function(){
		console.log('Device paused.');
		this.isPaused = true;
		window.removeEventListener('deviceorientation',deviceOrientationHandler,false);
	};

	this.start = function(){
		console.log('Device started.');
		this.isPaused = false;
		window.addEventListener('deviceorientation',deviceOrientationHandler,false);
	};

};



;
//
// Viewport class
// 

// BOUNDS - helper class

var Bounds = function(){

	this.x = 0; // upper left corner
	this.y = 0;
	this.w = 0;
	this.h = 0;

	this.setRect = function(x,y,w,h){
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	};

};

// VIEWPORT

var Viewport = function(){

	//this.FOV = 120;		// field-of-vision angle 
	//this.distance = 200;  // distance from the background

	this.rotation = 0; // rotation from the origin 0-359
	this.pitch = 90; // where 0 is facing down, 90 is facing horizon, 180 is facing up

	this.cameraBounds = new Bounds();
	this.cameraBounds.setRect(0,0,320,240);
	this.backgroundBounds = new Bounds();
	this.backgroundBounds.setRect(0,0,640,480);

	// Left & Right bounds describe the area of the background being mapped to viewport
	this.leftBounds = new Bounds();
	this.rightBounds = new Bounds();

	this.isWraparound = false; // if we wrap around the background seam

	updateBounds(this);


};

Viewport.prototype.rotateBy = function(rotation,pitch){

	this.rotation += rotation;
	this.pitch += pitch;

	//console.log("rotation, pitch ["+this.rotation+","+this.pitch+"]");

	// Keep within 0-359 rotation
	if(this.rotation > 359){
		this.rotation -= 360;
	}else if(this.rotation < 0){
		this.rotation += 360;
	}

	// Keep within 0-180 pitch -- fixed, no wrapping around
	
	if(this.pitch > 180){
		this.pitch = 180;
	}else if(this.pitch < 0){
		this.pitch = 0;
	}

	updateBounds(this);
};

Viewport.prototype.update = function(){
	updateBounds(this);
};

var updateBounds = function(viewport){

	// Update bounds
	var x_factor = viewport.backgroundBounds.w / 360;
	var y_factor = (viewport.backgroundBounds.h-viewport.cameraBounds.h) / 180;
	var cameraScale = 1; // this would adjust with the FOV
	var bgOffset_x = viewport.rotation * x_factor;
	var bgOffset_y = viewport.pitch * y_factor;

	var leftEdge = Math.floor( bgOffset_x - (0.5 * viewport.cameraBounds.w * cameraScale) );
	var rightEdge = leftEdge + (viewport.cameraBounds.w * cameraScale);

	var upperEdge = Math.floor( bgOffset_y );
	

	//console.log({x_factor:x_factor,y_factor:y_factor,bgOffset_x:bgOffset_x,bgOffset_y:bgOffset_y,leftEdge:leftEdge,rightEdge:rightEdge,upperEdge:upperEdge});

	//
	// HANDLE X 
	//

	// Case 1
	if(leftEdge < 0){
		//console.log("CASE 1: leftEdge < 0");
		viewport.leftBounds.x = viewport.backgroundBounds.w + leftEdge;
		viewport.leftBounds.w = Math.abs(leftEdge);
		viewport.rightBounds.x = 0;
		viewport.rightBounds.w = rightEdge;

		viewport.isWraparound = true;
	}else
	// Case 2
	if(leftEdge >= 0 && rightEdge <= viewport.backgroundBounds.w){
		//console.log("CASE 2: leftEdge > 0 && rightEdge < backgroundBounds.w");
		viewport.leftBounds.x = leftEdge;
		viewport.leftBounds.w = rightEdge - leftEdge;
		viewport.rightBounds.w = 0;

		viewport.isWraparound = false;
	}else
	// Case 3
	if(leftEdge >= 0 && rightEdge > viewport.backgroundBounds.w){
		//console.log("CASE 3: leftEdge > 0 && rightEdge > backgroundBounds.w");
		viewport.leftBounds.x = leftEdge;
		viewport.leftBounds.w = viewport.backgroundBounds.w - leftEdge;
		viewport.rightBounds.x = 0;
		viewport.rightBounds.w = rightEdge - viewport.backgroundBounds.w;

		viewport.isWraparound = true;
	}else{
		// ERROR
		console.error("ERROR - Left/Right edges fall out of bounds!");
		console.log("Left edge: "+leftEdge+", Right Edge: "+rightEdge);
	}

	//
	// HANDLE Y
	//


	if(upperEdge < 0){
		// THIS FIRES STRANGELY WHEN IT'S NOT TRUE!
		console.log("Upper:"+upperEdge+","+bgOffset_y+","+y_factor+","+viewport.pitch);
		//upperEdge = 0;
	}else if(upperEdge > (viewport.backgroundBounds.h - viewport.cameraBounds.h)){
		upperEdge = viewport.backgroundBounds.h - viewport.cameraBounds.h;
	}


	// UPDATE DRAWING OFFSETS
	viewport.backgroundBounds.x = 0-viewport.leftBounds.x;
	viewport.backgroundBounds.y = 0-upperEdge;

	viewport.leftBounds.h = viewport.rightBounds.h = viewport.cameraBounds.h;
	viewport.leftBounds.y = viewport.rightBounds.y = upperEdge;

	//console.log(viewport.leftBounds);
	//console.log(viewport.backgroundBounds);
};

Viewport.prototype.rotationToXOffset = function(){

	var factor = this.backgroundBounds.w / 360;
	//console.log(factor);
	return this.rotation * factor * -1;
};
;
//
// FauxPanorama class
//

var FauxPanorama = function(canvasID){

	var that = this;

	// PUBLIC VARIABLES
	var viewport = this.viewport = new Viewport();
	var device = this.device = new OrientationDevice();
	var preloader = this.preloader = new Preloader();
	var canvas = this.canvas = document.getElementById(canvasID);

	// INITIALISE VIEWPORT
	viewport.backgroundBounds.w = 640*8; // assumes 8 slices of 640x1600
	viewport.backgroundBounds.h = 1600;
	viewport.cameraBounds.w = canvas.width;
	viewport.cameraBounds.h = canvas.height;

	// Touch scrolling modifiers
	this.invertX = false; // true = background tracks touch movement
	this.invertY = false;
	this.speedX = 2;
	this.speedY = 4;

	// for JSHint
	var console = window.console;

	//
	// DEVICE MOVEMENT
	//

	device.callback = function(){

		viewport.rotation = device.direction ? device.direction : viewport.rotation;
		viewport.pitch = device.pitch;
		//that.update(); // update in draw loop
		
	};

	// 
	// EVENT HANDLERS
	//

	var lastMouseX, lastMouseY;

	var handleMouseDown = function(e){

		lastMouseX = e.clientX;
		lastMouseY = e.clientY;

		canvas.addEventListener('mousemove', handleMouseMove, false);
		canvas.addEventListener('touchmove', handleMouseMove, false);

		if(!device.isPaused){
			device.pause();
		}
	};

	var handleMouseMove = function(e){

		var user = ( e.hasOwnProperty('changedTouches') ) ? e.changedTouches[0]:e;

		var xDiff = user.clientX - lastMouseX;
		var yDiff = user.clientY - lastMouseY;

		lastMouseX = user.clientX;
		lastMouseY = user.clientY;

		var xRotation = 0;
		var yRotation = 0;

		if(xDiff > 0){
			xRotation = that.speedX;
		}else if(xDiff < 0){
			//console.log("NEG X");
			xRotation = -1*that.speedX;
		}
		
		if(yDiff > 0){
			yRotation = that.speedY;
		}else if(yDiff < 0){
			//console.log("NEG Y");
			yRotation = -1*that.speedY;
		}

		if(that.invertX){
			xRotation *= -1;
		}
		if(that.invertY){
			yRotation *= -1;
		}

		viewport.rotateBy(xRotation,yRotation);

		//that.update(); // --- no update, let draw loop handle it


	};

	var handleMouseUp = function(e){
		canvas.removeEventListener('mousemove', handleMouseMove, false);
		canvas.removeEventListener('touchmove', handleMouseMove, false);
	};
	
	
	var doResize = function() {
		//canvas.width = document.body.clientWidth;
		//canvas.height = document.body.clientHeight;

		viewport.cameraBounds.w = canvas.width;
		viewport.cameraBounds.h = canvas.height;

		that.update();
	};

	//
	// EVENT LISTENERS
	//

	// Handle window resizing
	window.addEventListener('resize', doResize, false);

	// Mouse events
	canvas.addEventListener('mousedown', handleMouseDown, false);
	canvas.addEventListener('mouseup', handleMouseUp, false);

	// Touch events
	canvas.addEventListener('touchstart', handleMouseDown, false);
	canvas.addEventListener('touchend', handleMouseUp, false);
};


// 
// START - OPTIONAL ANIMATION LOOP
//

FauxPanorama.prototype.start = function(){

	var that = this;
	var console = window.console; // silence JSHint

	var tickEvent = new Event('FP:tick');

	// On some devices setInterval may perform better than requestAnimationFrame

	// /*
	if(!this.timer){
		console.log('Starting interval loop...');
		this.timer = setInterval(function() {
			that.update();
			window.dispatchEvent(tickEvent);
		}, 30);
	}
	// */

	this.update();
	//requestAnimFrame(update);
};


//
// UPDATE
//

FauxPanorama.prototype.update = function(){

	var console = window.console; // silence JSHint

	var canvas = this.canvas;
	var c = canvas.getContext('2d');

	// Import for convenience
	var viewport = this.viewport;
	viewport.cameraBounds.w = canvas.width; // doesn't seem to belong here...
	viewport.cameraBounds.h = canvas.height;
	viewport.update(); // update bounds

	//var device = this.device;
	var preloader = this.preloader;

	// TIMING FOR DEBUGGING
	this.count = this.count ? this.count : 0;
	this.timestamp = (this.timestamp)?this.timestamp:Date.now();
	var newTimestamp = Date.now();
	var FPS = Math.floor( 1000 / (newTimestamp - this.timestamp) );
	this.timestamp = newTimestamp;
	this.count++;

	// DEBUG TEXT - will appear on canvas
	var debugText = "";
	
	// Clear the canvas
	c.clearRect(0, 0, canvas.width, canvas.height);
						
	//
	// DRAW BACKGROUND RECTS ------
	//

	// Left
	var offset = viewport.backgroundBounds.x;
	var slice_w = (viewport.backgroundBounds.w%8 === 0) ? viewport.backgroundBounds.w/8 : Math.floor(viewport.backgroundBounds.w/8)+1;
	var roundingAdjustment = Math.abs(slice_w*8 - viewport.backgroundBounds.w);

	var slice, sliceId;

	// Rect to illustrate left background
	c.fillStyle = 'rgb(255,0,0)';
	c.fillRect(viewport.backgroundBounds.x,viewport.backgroundBounds.y,viewport.backgroundBounds.w,viewport.backgroundBounds.h);

	// Image slices on left
	for(var i=0;i<8;i++){

		if(offset+slice_w >= 0 && offset < viewport.cameraBounds.w){

			sliceId = 'slice-0'+(i+1);
			slice = preloader.getById(sliceId);
			if(!slice){
				console.error("NO IMAGE FOUND: "+sliceId);
			}

			c.drawImage(slice,offset,viewport.backgroundBounds.y,slice_w,viewport.backgroundBounds.h);
		}
		offset += slice_w;
	}

	// Right
	if(viewport.isWraparound){

		offset = viewport.leftBounds.w+roundingAdjustment;

		// Rect for right background
		c.fillStyle = 'rgb(0,0,255)';
		c.fillRect(offset,viewport.backgroundBounds.y,viewport.backgroundBounds.w,viewport.backgroundBounds.h);

		// Image slices on right
		for(i=0;i<8;i++){

			if(offset+slice_w >=0 && offset < viewport.cameraBounds.w){
				//c.fillRect(offset,0,slice_w,480);

				sliceId = 'slice-0'+(i+1);
				slice = preloader.getById(sliceId);
				if(!slice){
					console.error("NO IMAGE FOUND: "+sliceId);
				}

				c.drawImage(slice,offset,viewport.backgroundBounds.y,slice_w,viewport.backgroundBounds.h);
			}


			offset += slice_w;
		}
	}

	// DEBUGGING DISPLAY 

	// TODO : Toggle debugging with FauxPanorama.debug variable -------

	// Outline viewport camera - for debugging
	//c.strokeStyle = 'rgb(0,0,0)';
	//c.strokeRect(viewport.cameraBounds.x,viewport.cameraBounds.y,viewport.cameraBounds.w,viewport.cameraBounds.h);

	// -----

	// DEBUG Text
	/*
	c.fillStyle = 'rgb(0,0,0)';
	c.font = 'bold 16px Arial, sans-serif';
	
	var textSize = c.measureText(debugText);
	var cx = (canvas.width / 2) - (textSize.width/2);
	var cy = (canvas.height / 2) - 8;
	
	c.fillText(debugText, cx, cy);
	// */

	// FPS Widget
	/*
	c.fillStyle = 'rgba(1,1,1,0.5)';
	c.fillRect(0,0,88,32);

	c.fillStyle = 'rgb(255,255,255)';
	c.fillText("FPS: "+FPS, 10,20);
	// */

};
;
// 
// FauxPanorama.js - Outro
//

// 
// END CLOSURE & Add FauxPanorama class to Global namespace
//

	window.FauxPanorama = FauxPanorama;

})(window);