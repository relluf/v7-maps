define(function(require) {
	
	require("script!https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js");
	
	mapkit.init({ authorizationCallback: function(done) {
		done("eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlhTM1oyMjdUTEsifQ.eyJpc3MiOiI2MlZLOUVINVVQIiwiaWF0IjoxNTM0MjEyMTQ2LjQzOCwiZXhwIjoxNjkyMDAwMTQ2LjQzOH0.cL-E0os0Oql6pT2ERvxFcT7v9byqfQYPEBcMqv0uQAgVfwGLqAq2x1pZ5Sc0zS9QDXJxgLTIz42wrZ9fe8oblQ");
	}});
	
	let map = new mapkit.Map("mapkit-map", {
		center: new mapkit.Coordinate(37.32, -121.88)
	});

	map.isZoomEnabled = true;
	map.isScrollEnabled = true;
	map.isRotationEnabled = true;

	map.showsUserLocationControl = true;
	map.showsUserLocation = true;
	map.showsMapTypeControl = true;
	map.showsScale = mapkit.FeatureVisibility.Visible;
	map.showsCompass = mapkit.FeatureVisibility.Visible;
	
	map.mapType = mapkit.Map.MapTypes.Hybrid;
	map.tintColor = "#123456";
	map.language = "du-NL";

	return map;
});
