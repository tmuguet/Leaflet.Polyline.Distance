(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(_dereq_,module,exports){
(function (global){
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var L = (typeof window !== "undefined" ? window['L'] : typeof global !== "undefined" ? global['L'] : null);

if (L.Polyline === undefined) {
  throw new Error('Cannot find L.Polyline');
}

function getLatLngsFlatten(polyline) {
  var latlngs = polyline.getLatLngs();

  if (latlngs.length > 0 && Array.isArray(latlngs[0])) {
    var result = [];

    for (var j = 0; j < latlngs.length; j += 1) {
      result = result.concat(latlngs[j]);
    }

    return result;
  }

  return latlngs;
} // From https://github.com/Leaflet/Leaflet.draw GeometryUtil.geodesicArea()


function geodesicArea(latLngs) {
  var pointsCount = latLngs.length;
  var area = 0.0;
  var d2r = Math.PI / 180;
  var p1;
  var p2;

  if (pointsCount > 2) {
    for (var i = 0; i < pointsCount; i += 1) {
      p1 = latLngs[i];
      p2 = latLngs[(i + 1) % pointsCount];
      area += (p2.lng - p1.lng) * d2r * (2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
    }

    area = area * 6378137.0 * 6378137.0 / 2.0;
  }

  return Math.abs(area);
}

if (typeof Math.radians === 'undefined') {
  // Converts from degrees to radians.
  Math.radians = function radians(degrees) {
    return degrees * Math.PI / 180;
  };
}

if (typeof Math.degrees === 'undefined') {
  // Converts from radians to degrees.
  Math.degrees = function degrees(radians) {
    return radians * 180 / Math.PI;
  };
} // from https://gis.stackexchange.com/questions/157693/getting-all-vertex-lat-long-coordinates-every-1-meter-between-two-known-points


function getDestinationAlong(from, azimuth, distance) {
  var R = 6378137; // Radius of the Earth in m

  var brng = Math.radians(azimuth); // Bearing is degrees converted to radians.

  var lat1 = Math.radians(from.lat); // Current dd lat point converted to radians

  var lon1 = Math.radians(from.lng); // Current dd long point converted to radians

  var lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / R) + Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng));
  var lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1), Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)); // convert back to degrees

  lat2 = Math.degrees(lat2);
  lon2 = Math.degrees(lon2);
  return L.latLng(lat2, lon2);
}

function bearingTo(start, end) {
  var startLat = Math.radians(start.lat);
  var startLong = Math.radians(start.lng);
  var endLat = Math.radians(end.lat);
  var endLong = Math.radians(end.lng);
  var dPhi = Math.log(Math.tan(endLat / 2.0 + Math.PI / 4.0) / Math.tan(startLat / 2.0 + Math.PI / 4.0));
  var dLong = endLong - startLong;

  if (Math.abs(dLong) > Math.PI) {
    if (dLong > 0.0) {
      dLong = -(2.0 * Math.PI - dLong);
    } else {
      dLong = 2.0 * Math.PI + dLong;
    }
  }

  return (Math.degrees(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
}

function routeBetween(from, to, interval) {
  var d = from.distanceTo(to);
  var azimuth = bearingTo(from, to);
  var latlngs = [from];

  for (var counter = interval; counter < d; counter += interval) {
    latlngs.push(getDestinationAlong(from, azimuth, counter));
  }

  latlngs.push(to);
  return latlngs;
}

function resample(latlngs, interval) {
  var newLatLngs = [];
  var size = latlngs.length;

  for (var i = 1; i < size; i += 1) {
    newLatLngs.push.apply(newLatLngs, _toConsumableArray(routeBetween(latlngs[i - 1], latlngs[i], interval)));
  }

  return newLatLngs;
}

L.Polyline.include({
  distanceTo: function distanceTo(o) {
    var resampling = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    var debug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var latlngs1 = getLatLngsFlatten(this);
    var latlngs2 = getLatLngsFlatten(o);

    if (resampling !== null && resampling > 0) {
      latlngs1 = resample(latlngs1, resampling);
      latlngs2 = resample(latlngs2, resampling);
    }

    var latlngs = latlngs1.concat(latlngs2.reverse());
    var area = geodesicArea(latlngs);
    var lengthPolyline1 = 0;

    for (var i = 1; i < latlngs1.length; i += 1) {
      lengthPolyline1 += latlngs1[i - 1].distanceTo(latlngs1[i]);
    }

    var lengthPolyline2 = 0;

    for (var _i = 1; _i < latlngs2.length; _i += 1) {
      lengthPolyline2 += latlngs2[_i - 1].distanceTo(latlngs2[_i]);
    }

    var lengthPolylineAvg = (lengthPolyline1 + lengthPolyline2) / 2;
    var distance = area / lengthPolylineAvg;
    return debug ? [distance, area, lengthPolylineAvg] : distance;
  }
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
