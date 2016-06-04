
(function (bs, injular) {
  'use strict';
  var TEMPLATE_CHANGED_EVENT = 'injularTemplate:changed';
  var SCRIPT_CHANGED_EVENT = 'injularScript:changed';

  var sockets = bs.socket;

  sockets.on(TEMPLATE_CHANGED_EVENT, injular.injectTemplate);
  sockets.on(SCRIPT_CHANGED_EVENT, injular.injectScript);
})(window.___browserSync___, window.injular);
