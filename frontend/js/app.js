'use strict';

// Declare app level module which depends on filters, and services

angular.module('myApp', [
  'ngRoute',
  'myApp.controllers',
  'myApp.filters',
  'myApp.services',
  'myApp.factories',
  'myApp.directives',
  'ngFileUpload',
  'btford.socket-io',
  'chart.js',
  'ngMaterial'
]).
config(function($routeProvider, $locationProvider, $mdThemingProvider) {
  $routeProvider.
    when('/audiofile', {
      templateUrl: 'partials/audioFilePartial'
    }).
    when('/yourmicro', {
      templateUrl: 'partials/microPartial'
    }).
    when('/corpus', {
      templateUrl: 'partials/corpusPartial'
    }).
    otherwise({
      templateUrl: 'partials/acceuilPartial'
    });
  $locationProvider.html5Mode(true);
  $mdThemingProvider.theme('default')
    .primaryPalette('orange')
    .accentPalette('deep-orange')
    .backgroundPalette('orange')
    .warnPalette('red');
});
