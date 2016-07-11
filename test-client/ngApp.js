/* global fileChanger */
angular.module('app', []);

angular.module('injularApp', [])
.config(function($compileProvider) {
  fileChanger._proxifyScopeFromCompile(window, $compileProvider);
});
