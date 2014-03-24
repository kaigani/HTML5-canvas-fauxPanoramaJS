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


