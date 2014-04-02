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
            window.setTimeout(callback, 1000 / 60); // 60 fps
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


