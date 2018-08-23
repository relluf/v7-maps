define(function(require) {
	
	// require("mapkit");
	
	mapkit.init({ authorizationCallback: function(done) {
		done("eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlhTM1oyMjdUTEsifQ.eyJpc3MiOiI2MlZLOUVINVVQIiwiaWF0IjoxNTM0MjEyMTQ2LjQzOCwiZXhwIjoxNjkyMDAwMTQ2LjQzOH0.cL-E0os0Oql6pT2ERvxFcT7v9byqfQYPEBcMqv0uQAgVfwGLqAq2x1pZ5Sc0zS9QDXJxgLTIz42wrZ9fe8oblQ");
	}});
	
	let map = new mapkit.Map("map", { center: new mapkit.Coordinate(37.32, -121.88) });
	map.showUserLocationControl = true;
	map.showsScale = true;//mapkit.FeatureVisibility.Visible;
	map.tintColor = "#123456";
	map.language = "du-NL";
	
	map.isZoomEnabled = true;
	map.isScrollEnabled = true;
	map.isRotationEnabled = true;
	
	map.showsMapTypeControl = true;
	map.showsUserLocationControl = true;
	map.showsUserLocation = true;

	let marker = new mapkit.MarkerAnnotation(map.center, {
        draggable: true,
        selected: true,
        title: "Plaats mij",
        subtitle: "Meetpunt locatie"
    });
    
    map.addAnnotation(marker);
	
	return map;
});
