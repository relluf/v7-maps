define(function(require) {
	
	require("stylesheet!./styles.less");

	var template = require("template7!./template.html");
	var Blocks = require("blocks/Blocks");
	var HE = require("util/HtmlElement");
	var $$ = Dom7;

	var Onderzoek = require("pages/veldoffice/onderzoek/component");
	var EM = require("veldoffice/EM");

	var on = {
		pageInit(e) {
			return Blocks.instantiate(["Map", "map"], "pages/map.html")
				.then(function(map) {
					map.setParentNode(e.target.qs(".page-content"));
					map.once("map-ready", function() {
						V7.initializeMap(map);
						
					//	Load all anchored onderzoeken
						var loaded = {};
						V7.objects.fetch("/menu").then(function(menu) {
							var anchors = menu.anchors;
							anchors.forEach(function(anchor) {
								if(anchor.path === "/veldoffice/onderzoek") {
									var onderzoek = EM.get("Onderzoek", anchor.key);
									Onderzoek.require_v7_export(onderzoek).then(function() {
										V7.mapOnderzoek(onderzoek);
										loaded[onderzoek._id] = true;
									});
								}	
							});
						});
						
						var selectors = {
							onderzoek: { all: {_id: {$gte: '/veldoffice/onderzoek/', $lt:"/veldoffice/onderzoek/_"}}}
						};
						V7.objects.db.find({selector: selectors.onderzoek.all})
							.then(_ => _.docs
								.filter(_ => _._id.endsWith("V7-export"))
								.filter(_ => loaded[_._id] === undefined)
								.sort((i1, i2) => i1.savedAt_ < i2.savedAt_ ? -1 : 1)
								.map(function(_) {
									var key = _._id.split("/")[3];
									var onderzoek = EM.get("Onderzoek", key);
									Onderzoek.require_v7_export(onderzoek).then(function() {
										V7.mapOnderzoek(onderzoek);
									});
								})
							);
					});
				});
		}
	};

	var blueCircle = L.AwesomeMarkers.icon({
		icon: 'circle',
		markerColor: 'darkblue'
	});
  
	return { 
		on: on, 
		template: template,
		bindings: {
			".swipe-handle.left click": function(e) {
				f7a.panel.left.open();
			},
			".toolbar .home.link click": function(e) {
				var origin = [52, 5.4, 2]; 
				V7.map.setView(origin, origin[2], {animate: true});		
			},
			".toolbar .location.link click": function(e) {
				e.target.up("body").down(".leaflet-control-locate a").click();
			},
			".toolbar .marker.link click": function(e) {
				var map = V7.getLeafletMap();
				var marker = new L.Marker(map.getCenter(), {
					bounceOnAdd: true, 
					draggable: true,
					icon: blueCircle
				}).addTo(map);
				
				if(!arguments.callee.init) {
					arguments.callee.init = true;
					map.on("move", function() {
						if(map.$$marker) {
							if(HE.hasClass(map.$$marker._icon, "selected")) {
								map.$$marker.setLatLng(map.getCenter());
								map.$$marker._icon.focus();
							}
						}
					});
					map.on("click", function() {
						if(map.$$marker && HE.hasClass(map.$$marker._icon, "selected")) {
							HE.removeClass(map.$$marker._icon, "selected");
							delete map.$$marker;
						}
					});
				}
				
				if(map.$$marker && HE.hasClass(map.$$marker._icon, "selected")) {
					HE.removeClass(map.$$marker._icon, "selected");
					delete map.$$marker;
				}
				
				marker.on("dblclick", function(e) {
					console.log(e);
					if(e.originalEvent.preventDefault) {
						e.originalEvent.preventDefault();
					}
					
					// map.setView(marker.getLatLng());
					marker._icon.style.outline = hl;
					marker._icon.style.outlineStyle = "dashed";
					marker._icon.tabIndex = 1;
					marker._icon.focus();
				});
				marker.on("click", function() {
					// if(map.$$marker === this) {
						HE.toggleClass(marker._icon, "selected");
					// }
					
					if(HE.hasClass(marker._icon, "selected")) {
						map.setView(marker.getLatLng());
						delete map.$$marker;
						setTimeout(function() {
							map.$$marker = marker;
						}, 500);
					} else {
						delete map.$$marker;
					}
				});
			},
			".toolbar .history-back.link click": function(e) {
			},
			".toolbar .history-forward.link click": function(e) {
			}
		}
	};
});