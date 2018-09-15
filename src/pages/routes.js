define(function(require) {

	var menu = require("pages/v7/menu/component");
	var menufix = require("pages/v7/menu-fix/component");
	var map = require("pages/v7/map/component");
	var settings = require("pages/v7/settings/component");

	var fotos = require("pages/veldoffice/fotos/component");	
	var onderzoeken = require("pages/veldoffice/onderzoeken/component");
	var onderzoek = require("pages/veldoffice/onderzoek/component");
	var meetpunt = require("pages/veldoffice/meetpunt/component");
	
	function url(path, url) {
		return { path: path, componentUrl: "pages/" + url + ".html" };
	}
	function component(path, component) {
		if(component.templates && !component.template) {
			component.template = component.templates.page;
		}
		if(component.bindings) {
			component.on = component.on || {};
			var pageInit = component.on.pageInit;
			component.on.pageInit = function(e) {
				var bindings = typeof component.bindings === "function" ? component.bindings() : component.bindings;
				
				if(bindings.navbar) {
					if(!bindings.page) console.warn("use navbar and page");
					e.target.bindAll(bindings.page || bindings);
					e.target.up(".view").down(".navbar").bindAll(bindings.navbar);
				} else {
					e.target.bindAll(bindings);
				}
				
				return typeof pageInit === "function" ? pageInit(e) : component;
			};
		}

		return { path: path, /*template: component.template,*/ component: component };
	}
	
	return [
		component("/map", map ),
		component("/menu", menu ),
		component("/settings", settings ),
		component("/menu-fix", menufix ),
		
		url("/account", "veldoffice/account"),
 		url("/login", "veldoffice/login"),

		component("/veldoffice/onderzoeken", onderzoeken),
		component("/veldoffice/onderzoek", onderzoek),
		component("/veldoffice/meetpunt", meetpunt),
		component("/veldoffice/fotos", fotos),
		
		url("-", "-")
	];
});
