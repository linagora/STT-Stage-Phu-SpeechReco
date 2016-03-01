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
  'btford.socket-io'
]).
config(function($routeProvider, $locationProvider) {
  $routeProvider.
    when('/audiofile', {
      templateUrl: 'partials/audioFilePartial',
      controller: 'MyCtrl1' 
    }).
    when('/yourmicro', {
      templateUrl: 'partials/microPartial',
      controller: 'MyCtrl2'
    }).
    when('/corpus', {
      templateUrl: 'partials/corpusPartial',
      controller: 'MyCtrl2'
    }).
    otherwise({
      templateUrl: 'partials/acceuilPartial'
    });

  $locationProvider.html5Mode(true);
});
