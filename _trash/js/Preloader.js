//
// Preloader
// 

(function(window){
	
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
			if(count === 0) that.callback.call(); // call the callback
		};

		this.callback = function(){
			// default callback
			console.log('No preloader callback defined.');
		};

		this.getById = function(id){

			return assets[id];
		};

	};

	window.Preloader = Preloader;

})(window);