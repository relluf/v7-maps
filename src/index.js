require.config({
	paths: {
		"jquery": "./node_modules/jquery/dist/jquery",
        "less": "bower_components/less/dist/less",

		"text": "./node_modules/cavalion-js/src/text",
		"stylesheet": "./node_modules/cavalion-js/src/stylesheet",
		"script": "./node_modules/cavalion-js/src/script",

		"js": "./node_modules/cavalion-js/src/js",
		"on": "./node_modules/cavalion-js/src/on",
		"data": "./node_modules/cavalion-js/src/data",
		"util": "./node_modules/cavalion-js/src/util",
		"locale": "./node_modules/cavalion-js/src/locale",

		"entities": "./node_modules/cavalion-js/src/entities",
		"vcl": "./node_modules/cavalion-vcl/src/",
		"vcl/veldoffice": "../lib/veldoffice-js/src/veldapps.com/veldoffice/vcl-veldoffice",
		"blocks": "./node_modules/cavalion-blocks/src/",
		
		"veldoffice": "../lib/veldoffice-js/src/veldapps.com/veldoffice"
	}
});

define("framework7/plugins/auto-back-title", function() {
	
	var selectors = {
		back: ".navbar .back.link span",
		title: ".title"
	};

    /*- Link title of back button to title of page */
    document.addEventListener("page:beforein", function (e) {
    	
    	if(e.detail.direction !== "forward") {
    		return;
    	}
    	
    	var previous = e.detail.pageFrom;
    	if(!previous) return;
    	
    	var current = e.detail;
        var back = current.navbarEl && current.navbarEl.down(selectors.back);

        if(back && previous.navbarEl) {
            back.innerHTML = previous.navbarEl.down(selectors.title).innerHTML;
        }
    });
    
    return selectors;
});
define("framework7/plugins/esc-is-back", ["Element"], function() {  // Element?
	var selectors = {
		back: ".view-main .navbar .navbar-current .left a.back.link",
	};
	document.addEventListener("keyup", function(e) {
		if(e.keyCode === 27) {
			e.preventDefault();
			document.qsa(selectors.back).forEach(function(el, index) {
				if(index === 0) el.click();
			});
		}
	});
	return selectors;
});


define("framework7", function(require) { 
	var Framework7 = require("./node_modules/framework7/js/framework7");
	var Panels = require("./node_modules/framework7-plugin-3d-panels/dist/framework7.3dpanels");
	
	require("framework7/plugins/auto-back-title");
	require("stylesheet!./node_modules/framework7/css/framework7.min.css");
	Framework7.use(Panels);

	return Framework7; 
});
define("mapkit/map", [], function() {
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

	// let marker = new mapkit.MarkerAnnotation(map.center, {
 //       draggable: true,
 //       selected: true,
 //       title: "Plaats mij",
 //       subtitle: "Meetpunt locatie"
 //   });
    
 //   map.addAnnotation(marker);
	
	return map;
});
define("app/hotkeys", ["util/HotkeyManager"], function(HKM) {

	/* toggle-menu */
	HKM.register("Escape", {
		type: "keydown",
		callback: function(e) {
			if(f7a.panel.left.opened) {
				f7a.panel.left.close();
			} else {
				f7a.panel.left.open();
			}
		}
	});

});

window.locale_base = "locales/";
require(["on", "locale!en-US", "locale!du-NL"], function() {
	
	locale.loc = "du-NL";
	require(["framework7"], function(Framework7) {
		
		if(Framework7.device.iphoneX === true) {
			document.documentElement.classList.add("iphonex");
		}
	
		require(["main", "text!pages/investigations-template.html"]);
	});
});

define("collections/Investigations", ["veldoffice/EM", "veldoffice/Session"], function() {
	
	return {
	
		getPage: function() {},
		nextPage: function() {}
		
	};
	
});
