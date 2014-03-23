//
// Preloader
// 

(function(window){
	
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

	var Viewport = function(){

		this.FOV = 120;		// field-of-vision angle 
		this.distance = 200;  // distance from the background

		this.rotation = 0; // rotation from the origin 0-359
		this.pitch = 90; // where 0 is facing down, 90 is facing horizon, 180 is facing up

		this.cameraBounds = new Bounds();
		this.cameraBounds.setRect(0,0,320,240);
		this.backgroundBounds = new Bounds();
		this.backgroundBounds.setRect(0,0,640,480);

		this.projectionBounds = new Bounds();
		//this.rightBounds = new Bounds();

		this.isWraparound = false; // if we wrap around the background seam

		updateBounds(this);


	};

	Viewport.prototype.rotateBy = function(rotation,pitch){

		this.rotation += rotation;
		this.pitch += pitch;

		console.log("rotation, pitch ["+this.rotation+","+this.pitch+"]");

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
			viewport.projectionBounds.x = viewport.backgroundBounds.w + leftEdge;
			viewport.projectionBounds.w = Math.abs(leftEdge);
			//viewport.rightBounds.x = 0;
			//viewport.rightBounds.w = rightEdge;

			viewport.isWraparound = true;
		}else
		// Case 2
		if(leftEdge >= 0 && rightEdge <= viewport.backgroundBounds.w){
			//console.log("CASE 2: leftEdge > 0 && rightEdge < backgroundBounds.w");
			viewport.projectionBounds.x = leftEdge;
			viewport.projectionBounds.w = rightEdge - leftEdge;
			//viewport.rightBounds.w = 0;

			viewport.isWraparound = false;
		}else
		// Case 3
		if(leftEdge >= 0 && rightEdge > viewport.backgroundBounds.w){
			//console.log("CASE 3: leftEdge > 0 && rightEdge > backgroundBounds.w");
			viewport.projectionBounds.x = leftEdge;
			viewport.projectionBounds.w = viewport.backgroundBounds.w - leftEdge;
			//viewport.rightBounds.x = 0;
			//viewport.rightBounds.w = rightEdge - viewport.backgroundBounds.w;

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
		viewport.backgroundBounds.x = 0-viewport.projectionBounds.x;
		viewport.backgroundBounds.y = 0-upperEdge;

		//console.log(viewport.projectionBounds);
		//console.log(viewport.backgroundBounds);
	};

	Viewport.prototype.rotationToXOffset = function(){

		var factor = this.backgroundBounds.w / 360;
		//console.log(factor);
		return this.rotation * factor * -1;
	};

	window.Viewport = Viewport;

})(window);