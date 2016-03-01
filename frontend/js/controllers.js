'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('AppCtrl', function($scope, $http, appname) {
    $http({
      method: 'GET',
      url: '/api/name'
    }).
    success(function(data, status, headers, config) {
      $scope.name = appname;
    }).
    error(function(data, status, headers, config) {
      $scope.name = 'Error!';
    })
  }).
  controller('MyCtrl1', function($scope) {
    // write Ctrl here
  }).
  controller('MyCtrl2', function($scope) {
    // write Ctrl here
  })

