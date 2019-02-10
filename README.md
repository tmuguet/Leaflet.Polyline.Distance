# Leaflet Distance

This plugins enables you to compute distance between two `L.PolyLine` objects.

![Distance](area.png 'Distance measuring via area difference')

To compute a distance, this simple algorithm computes the area delimited by the two tracks and simply divides it by the length of the tracks.

It works best if the two polylines have their points at the same distance of each others; otherwise sampling up the lines gives a pretty good approximation.

## Installing

Put the _L.Polyline.Distance_ script after the Leaflet one:

```
<script src="leaflet.js"></script>
<script src="L.Polyline.Distance.min.js"></script>
```

## Usage

This plugins adds one methods to `L.Polyline` objects:

- `distanceTo(other: L.Polyline, resampling?: number, debug?: boolean)`: computes the distance

Given two `L.Polyline` objects `a` and `b`, get the distance between `a` and `b` simply by calling `a.distanceTo(b)`.

For better results, the methods resample the polylines up to at least one point every 10 meters. You can turn it off by passing `null` as `resampling` parameter.

If `debug` is set to `true`, instead of simply returning the distance, the function returns an array with 3 numbers: the distance, the area and the average lengths of the tracks.

## Credits

All the real work comes from:

- [Leaflet Draw](https://github.com/Leaflet/Leaflet.draw) for their `GeometryUtil.geodesicArea` function
- [GIS StackExchange](https://gis.stackexchange.com/questions/157693/getting-all-vertex-lat-long-coordinates-every-1-meter-between-two-known-points) for the resampling
