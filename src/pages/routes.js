define(function(require) {

	var menu = require("pages/v7/menu/component");
	var menufix = require("pages/v7/menu-fix/component");
	var map = require("pages/v7/map/component");
	var settings = require("pages/v7/settings/component");
	var language = require("pages/v7/settings/language/component");

	var fotos = require("pages/veldoffice/fotos/component");	
	var onderzoeken = require("pages/veldoffice/onderzoeken/component");
	// var onderzoek_recent = require("pages/veldoffice/onderzoek/recent/component");
	var onderzoek = require("pages/veldoffice/onderzoek/component");
	var onderzoek_new = require("pages/veldoffice/onderzoek/new-popup/component");
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
					if(e.detail.navbarEl) {
						// There seems to be a difference between iOS & Android (as I understand now)
						e.detail.navbarEl.bindAll(bindings.navbar);
					} else {
						e.detail.el.down(".navbar").bindAll(bindings.navbar);
					}
				} else {
					e.target.bindAll(bindings);
				}
				return typeof pageInit === "function" ? pageInit(e) : component;
			};
		}

		return { path: path, /*template: component.template,*/ component: component };
	}
	function popup_url(path, url) {
		return { path: path, popup: { componentUrl: "pages/" + url + ".html" } };
	}
	function popup_component(path, component) {
		return { path: path, popup: { component: component } };
	}
	
	return [
		component("/map", map ),
		component("/menu", menu ),
		component("/settings", settings ),
		component("/settings/language", language),
		component("/menu-fix", menufix ),
		
		url("/account", "veldoffice/account"),
 		popup_url("/login", "veldoffice/login"),
 		
 		popup_component("/veldoffice/onderzoek/new", onderzoek_new),
 		// { path: "/veldoffice/onderzoek/new", popup: { component: component("/veldoffice/onderzoek/new-popup", onderzoek_new) }},

		component("/veldoffice/onderzoeken", onderzoeken),
		component("/veldoffice/onderzoek", onderzoek),
		component("/veldoffice/meetpunt", meetpunt),
		component("/veldoffice/fotos", fotos),
		
		url("-", "-")
	];
});
