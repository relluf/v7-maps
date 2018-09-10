define(function(require) {

	var menu = require("pages/v7/menu/component");
	var menufix = require("pages/v7/menu-fix/component");
	var map = require("pages/v7/map/component");
	
	var onderzoeken = require("pages/veldoffice/onderzoeken/component");
	var onderzoek = require("pages/veldoffice/onderzoek/component");
	var meetpunt = require("pages/veldoffice/meetpunt/component");
	
	function url(path, url) {
		return { path: path, componentUrl: "pages/" + url + ".html" };
	}
	function component(path, component) {
		if(component.bindings) {
			component.on = component.on || {};
			var pageInit = component.on.pageInit;
			component.on.pageInit = function(e) {
				var bindings = typeof component.bindings === "function" ? component.bindings() : component.bindings;
				e.target.bindAll(bindings);
				// if(typeof bindings['page:init'] === "function") {
				// 	// there really is a need to simulate page:init?
				// 	bindings['page:init'].apply(this, [e]);
				// }
				return typeof pageInit === "function" ? pageInit(e) : component;
			};
		}

		return { path: path, /*template: component.template,*/ component: component };
	}
	
	return [
		// url("/menu", "menu"),
		// url("/map", "map"),

		component("/map", map ),
		component("/menu", menu ),
		component("/menu-fix", menufix ),
		component("/veldoffice/onderzoeken", onderzoeken),
		component("/veldoffice/onderzoek", onderzoek),
		component("/veldoffice/meetpunt", meetpunt),
		
		// url("/veldoffice/onderzoek", "veldoffice/onderzoek"),
		// url("/veldoffice/meetpunt", "veldoffice/meetpunt"),
		
 		url("/login", "veldoffice/login"),

		url("/photos", "photos")
	];
});
