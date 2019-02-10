const L = require('leaflet');

if (L.Polyline === undefined) {
  throw new Error('Cannot find L.Polyline');
}

function getLatLngsFlatten(polyline) {
  const latlngs = polyline.getLatLngs();

  if (latlngs.length > 0 && Array.isArray(latlngs[0])) {
    let result = [];
    for (let j = 0; j < latlngs.length; j += 1) {
      result = result.concat(latlngs[j]);
    }

    return result;
  }
  return latlngs;
}

// From https://github.com/Leaflet/Leaflet.draw GeometryUtil.geodesicArea()
function geodesicArea(latLngs) {
  const pointsCount = latLngs.length;
  let area = 0.0;
  const d2r = Math.PI / 180;
  let p1;
  let p2;

  if (pointsCount > 2) {
    for (let i = 0; i < pointsCount; i += 1) {
      p1 = latLngs[i];
      p2 = latLngs[(i + 1) % pointsCount];
      area += (p2.lng - p1.lng) * d2r * (2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
    }
    area = (area * 6378137.0 * 6378137.0) / 2.0;
  }

  return Math.abs(area);
}

if (typeof Math.radians === 'undefined') {
  // Converts from degrees to radians.
  Math.radians = function radians(degrees) {
    return (degrees * Math.PI) / 180;
  };
}

if (typeof Math.degrees === 'undefined') {
  // Converts from radians to degrees.
  Math.degrees = function degrees(radians) {
    return (radians * 180) / Math.PI;
  };
}

// from https://gis.stackexchange.com/questions/157693/getting-all-vertex-lat-long-coordinates-every-1-meter-between-two-known-points
function getDestinationAlong(from, azimuth, distance) {
  const R = 6378137; // Radius of the Earth in m
  const brng = Math.radians(azimuth); // Bearing is degrees converted to radians.
  const lat1 = Math.radians(from.lat); // Current dd lat point converted to radians
  const lon1 = Math.radians(from.lng); // Current dd long point converted to radians
  let lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance / R) + Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng),
  );
  let lon2 = lon1
    + Math.atan2(
      Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2),
    );

  // convert back to degrees
  lat2 = Math.degrees(lat2);
  lon2 = Math.degrees(lon2);
  return L.latLng(lat2, lon2);
}

function bearingTo(start, end) {
  const startLat = Math.radians(start.lat);
  const startLong = Math.radians(start.lng);
  const endLat = Math.radians(end.lat);
  const endLong = Math.radians(end.lng);
  const dPhi = Math.log(Math.tan(endLat / 2.0 + Math.PI / 4.0) / Math.tan(startLat / 2.0 + Math.PI / 4.0));
  let dLong = endLong - startLong;
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
  const d = from.distanceTo(to);
  const azimuth = bearingTo(from, to);
  const latlngs = [from];

  for (let counter = interval; counter < d; counter += interval) {
    latlngs.push(getDestinationAlong(from, azimuth, counter));
  }

  latlngs.push(to);
  return latlngs;
}

function resample(latlngs, interval) {
  const newLatLngs = [];
  const size = latlngs.length;

  for (let i = 1; i < size; i += 1) {
    newLatLngs.push(...routeBetween(latlngs[i - 1], latlngs[i], interval));
  }

  return newLatLngs;
}

L.Polyline.include({
  distanceTo(o, resampling = 10, debug = false) {
    let latlngs1 = getLatLngsFlatten(this);
    let latlngs2 = getLatLngsFlatten(o);

    if (resampling !== null && resampling > 0) {
      latlngs1 = resample(latlngs1, resampling);
      latlngs2 = resample(latlngs2, resampling);
    }

    const latlngs = latlngs1.concat(latlngs2.reverse());

    const area = geodesicArea(latlngs);
    let lengthPolyline1 = 0;
    for (let i = 1; i < latlngs1.length; i += 1) {
      lengthPolyline1 += latlngs1[i - 1].distanceTo(latlngs1[i]);
    }
    let lengthPolyline2 = 0;
    for (let i = 1; i < latlngs2.length; i += 1) {
      lengthPolyline2 += latlngs2[i - 1].distanceTo(latlngs2[i]);
    }

    const lengthPolylineAvg = (lengthPolyline1 + lengthPolyline2) / 2;
    const distance = area / lengthPolylineAvg;

    return debug ? [distance, area, lengthPolylineAvg] : distance;
  },
});
