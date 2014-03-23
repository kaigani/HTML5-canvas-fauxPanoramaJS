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
		//that.update();
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

		that.update();


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