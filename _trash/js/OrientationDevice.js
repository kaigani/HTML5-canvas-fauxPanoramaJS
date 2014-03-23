//
// Orientation Device
//

(function(window){
	
	// Class definition
	var OrientationDevice = function(){

		var that = this;

		this.isPaused = false;

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

			that.tiltLR = e.gamma;
			that.tiltFB = e.beta;
			that.direction = e.alpha;

			var isLandscape = (document.body.clientWidth > document.body.clientHeight);
			that.pitch = (isLandscape) ? Math.abs(e.gamma) : Math.abs(e.beta);
			that.roll  = (isLandscape) ? -1*e.beta : e.gamma;

			if(that.callback) that.callback.call();
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

	OrientationDevice.prototype.isLandscape = function(){

		return (document.body.clientWidth > document.body.clientHeight);
	};

	window.OrientationDevice = OrientationDevice;

})(window);