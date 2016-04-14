(function() {
  'use strict';
  var bs = {
    __events: {},
    socket: {
      on: onSocket
    }
  };

  window.___browserSync___ = bs;


  function onSocket(eventName, listener) {
    bs.__events[eventName] = listener;
  }
})();
