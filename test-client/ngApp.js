angular.module('app', []);

angular.module('quiet-app', [])
.factory('$exceptionHandler', function() {
  return function() {/*noop*/};
});
