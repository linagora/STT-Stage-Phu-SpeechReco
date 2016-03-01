'use strict';

/* Filters */

angular.module('myApp.filters', []).
  filter('interpolate', function(appname) {
    return function(text) {
      return String(text).replace(/\%NAME\%/mg, appname);
    };
  });
