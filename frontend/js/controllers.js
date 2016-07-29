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
  controller('tabController', function($scope) {
    $scope.tab = 1;

    $scope.isSet = function(checkTab) {
      return ($scope.tab === checkTab);
    };

    $scope.setTab = function(setTab) {
      $scope.tab = setTab;
    };
  });

