define(function(require) {

	var URL = "/office-rest/action/profielen?view=V7-export&id=";
	
	var template = require("template7!./template.html");
	var anchor_tmpl = require("template7!./anchor-template.html");
	var fotos = require("../fotos/component");
	var Session = require("veldoffice/Session");
	var EM = require("veldoffice/EM");
	var on = require("on");
	var module = require("module");
	
	var menu = V7.objects.get("/menu");
	
	function isAnchored(route) {
		var key = route.query.key, path = route.path;
		var anchors = (menu.anchors || []);
		return anchors.find(_ => _.key === key && _.path === path);
	}
	function getData(e, onderzoek) {
		var data = js.get("_views.v7-export", onderzoek);
		if(!data) {
			js.set("_views.v7-export", data = Session.get(URL + onderzoek.id)
				.then(function(resp) {
					EM.processWalkResult2(resp);
					return js.set("_views.v7-export", resp, onderzoek);
				}), onderzoek
			);
		}
		
		if(data instanceof Promise) {
			$$(e.target).addClass("loading");
			var cr = f7a.views.left.router.currentRoute;
			data.then((res) => {
				$$(e.target).removeClass("loading");	
				if(cr === f7a.views.left.router.currentRoute) {
					// only refresh page if still current
					f7a.views.left.router.refreshPage();
				}
				return res;
			});
		}
	}

	return {
		bindings: {
			".list.fotos click": function(e) {
				var key = js.get("route.query.key", e.target.up(".page").f7Page);
				var onderzoek = EM.get("Onderzoek", key);
				
				var li = e.target.up("li"), img = li.down("img");
				var f1 = locale("Foto.factories/src"), 
					f2 = locale("Foto.factories/header.onderzoek");
				var photos = (onderzoek.fotos || []).map(function(foto) {
					return { url: f1.apply(foto, []), 
						caption: String.format("%H", f2.apply(foto, [])) };
				});
				var index = Array.from(li.parentNode.childNodes).indexOf(li);
				var pb = f7a.photoBrowser.create({
					type: "popup",
					photos: photos,
					// backLinkText: "&nbsp;",
					renderNavbar: function() {
						return fotos.templates.navbar({pb: pb}); //this?
					}
				});
				pb.open(index);
			},
			".ptr-content ptr:refresh": function(e) {
				setTimeout(() => f7a.ptr.done(e.target), 1000);
			},
			".show-on-map click": function(e) {
				var pageEl = e.target.up(".page");
				var key = js.get("f7Page.route.query.key", pageEl);
				V7.showOnMap("Onderzoek", EM.get("Onderzoek", key));
			},
			".button.anchor click": function(e) {
				var comp = e.target.up(".page").f7Component;
				var route = e.target.up(".page").f7Page.route;
				var index = isAnchored(route);
				if(index !== undefined) {
					menu.anchors.splice(index, 1);
				} else {
					menu.anchors.unshift({
						path: route.path,
						url: route.url,
						key: route.query.key,
						html: anchor_tmpl(comp)
					});
				}
				V7.objects.save(menu).then(function() {
					V7.router.refresh("/menu");
				});
				V7.router.refresh("/veldoffice/onderzoek");
			}
		},
		on: { 
			pageInit(e) {
				var key = js.get("detail.router.currentRoute.query.key", e);
				var onderzoek = EM.get("Onderzoek", key);
				getData(e, onderzoek);
				
				f7a.virtualList.create({
					el: e.target.qs(".list.fotos.virtual-list"),
			        cache: !false,
					items: EM.get("Onderzoek", key).fotos || [],
			        itemTemplate: fotos.templates.infinite_onderzoek,
			        height: 98,
			        cols: 4
				});
			} 
		},
		data: function() {
			return js.mixIn({
				anchored: isAnchored(this.$route)
			}, EM.get("Onderzoek", this.$route.query.key));
		},
		template: template
	};
	
});