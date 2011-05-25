/* Flash Player Type
================================================================================ */
VideoJS.fn.extend({

  flashSupported: function(){
    if (!this.flashElement) { this.flashElement = this.getFlashElement(); }
    // Check if object exists & Flash Player version is supported
    return !!(this.flashElement && this.flashPlayerVersionSupported());
  },

  flashInit: function(){
    this.replaceWithFlash();
    this.element = this.flashElement;
    this.video.src = ""; // Stop video from downloading if HTML5 is still supported
    var flashPlayer = VideoJS.flashPlayers[this.options.flashPlayer];
    flashPlayer.init.call(this);
    this.api = flashPlayer.api;
    this.api.setupTriggers.call(this);
  },

  // Get Flash Fallback object element from Embed Code
  getFlashElement: function(){
    var children = this.video.children;
    for (var i=0,j=children.length; i<j; i++) {
      if (children[i].className == "vjs-flash-fallback") {
        return children[i];
      }
    }
  },

  // Used to force a browser to fall back when it's an HTML5 browser but there's no supported sources
  replaceWithFlash: function(){
    // this.flashElement = this.video.removeChild(this.flashElement);
    if (this.flashElement) {
      this.box.insertBefore(this.flashElement, this.video);
      this.video.style.display = "none"; // Removing it was breaking later players
    }
  },

  // Check if browser can use this flash player
  flashPlayerVersionSupported: function(){
    var playerVersion = (this.options.flashPlayerVersion) ? this.options.flashPlayerVersion : VideoJS.flashPlayers[this.options.flashPlayer].flashPlayerVersion;
    return VideoJS.getFlashVersion() >= playerVersion;
  }
});

/* Flash Object Fallback (Flash Player)
================================================================================ */
VideoJS.flashPlayers = {};
VideoJS.flashPlayers.htmlObject = {
  flashPlayerVersion: 9,
  init: function() { return true; },
  api: {} // No video API available with HTML Object embed method
};

VideoJS.flashPlayers.wbxVideoPlayer = {
  flashPlayerVersion: 8,
  stateIntervals: [],
  //TODO make js/flash api for WBX Video Player
  init: function() { return true; },
  api: {
    setupTriggers: function(){
      // Since the player doesn't have a way to tell it how to call back to JS
      // Here we set up a polling interval to see the current player state.
      var videoPlayer = this;
      var nextIntervalId = this.api.stateIntervals.length;
      this.api.stateIntervals[nextIntervalId] = setInterval(function() {
        try {
          var newState = videoPlayer.flashElement.handleExternalCallback("getPlayerState");
          if(videoPlayer.state != newState) {
              videoPlayer.state = newState;
              videoPlayer.triggerListeners("stateChange", {data: newState})
          }
        } catch (e) {
            this.warning(VideoJS.warnings.noFlashToJSAPI);
            clearInterval(this.api.stateIntervals[nextIntervalId]);
        }
      })
    },

    play: function(){ return this.flashElement.handleExternalCallback("playVideo"); },
    pause: function(){ return this.flashElement.handleExternalCallback("pauseVideo"); },
    paused: function(){ return this.flashElement.handleExternalCallback("getPlayerState") === 2; },

    currentTime: function(){ return this.flashElement.handleExternalCallback("getCurrentTime"); },
    setCurrentTime: function(seconds){
      try { this.flashElement.handleExternalCallback("seekTo", seconds, false); }
      catch(e) { this.warning(VideoJS.warnings.videoNotReady); }
    },

    duration: function(){ return this.flashElement.handleExternalCallback("getDuration"); },
    buffered: function(){ return this.flashElement.handleExternalCallback("isPlayerLoaded"); },

    //TODO get and set specific volume.
    volume: function(){ return this.flashElement.handleExternalCallback("isMuted") ? 0 : 1; },
    setVolume: function(percentAsDecimal){
        if (percentAsDecimal) {
            this.flashElement.handleExternalCallback("unMute");
        } else {
            this.flashElement.handleExternalCallback("mute");
        }
    },

    width: function(){ return this.video.offsetWidth; },
    height: function(){ return this.video.offsetHeight; },

    supportsFullScreen: function(){
      //TODO implement in flash player
      return false;
    },
    enterFullScreen: function(){
      //TODO implement in flash player
      return false;
    },
    src: function(src){
      this.flashElement.handleExternalCallback("loadVideoByUrl", src);
    }
  }
}

