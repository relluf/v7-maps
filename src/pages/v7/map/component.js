define(function(require) {

	var template = require("template7!./template.html");
	var Blocks = require("blocks/Blocks");
	var $$ = Dom7;

	var on = {
		pageInit(e) {
			// $$(".swipe-handle.left", e.target).on("click", function() {
			// 	f7a.panel.left.open();
			// });
			
			// $$(".toolbar .link.home", e.target).on("click", function() {
			// 	var origin = [52, 5.4, 2]; 
			// 	V7.map.setView(origin, origin[2], {animate: true});		
			// });
			// $$(".toolbar .link.location", e.target).on("click", function() {
			// 	e.target.down(".leaflet-control-locate a").click();
			// });
			
			return Blocks.instantiate(["Map", "map"], "pages/map.html")
				.then(function(map) {
					map.setParentNode(e.target.qs(".page-content"));
					map.once("map-ready", function() {
						V7.initializeMap(map);
					});
				});
		}
	};

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
			".toolbar .home.location click": function(e) {
				e.target.down(".leaflet-control-locate a").click();
			},
			".history-back.link click": function(e) {
			
			}
		}
	};
});