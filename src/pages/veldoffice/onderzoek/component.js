define(function(require) {

	var URL = "/office-rest/action/profielen?view=V7-export&id=";

	var template = require("template7!./template.html");
	var anchor_tmpl = require("template7!./anchor-template.html");
	var fotos = require("../fotos/component");
	var Session = require("veldoffice/Session");
	var EM = require("veldoffice/EM");
	var on = require("on");

	function anchorIndex(route) {
		var menu = V7.objects.get("/menu");
		var key = route.query.key, path = route.path;
		var anchors = (menu.anchors || []);
		return anchors.findIndex(_ => _.url === route.url);
	}
	function isAnchored(route) {
		var menu = V7.objects.get("/menu");
		var key = route.query.key, path = route.path;
		var anchors = (menu.anchors || []);
		return anchors.findIndex(_ => _.url === route.url) !== -1;
	}
	function isLoading(onderzoek) {
		var root = getNestedDoc(onderzoek, "V7-export").root;
		return root === undefined || root instanceof Promise;
	}
	function isExpired(onderzoek, doc) {
		var o = new Date(onderzoek.modified).getTime();
		var d = new Date(doc.modified || 0).getTime();
		return o > d;
	}

	function check_loaded(onderzoek, doc, currentRoute) {
		if(doc.root && !doc.$$loaded) {
			EM.processWalkResult2(doc.root);
			doc.$$loaded = true;
			currentRoute && setTimeout(function() {
				V7.router.refresh(currentRoute.url);
			}, 500);
		}
	}	
	function getNestedDoc(onderzoek, name) {
		return V7.objects.get(String.format(
				"/veldoffice/onderzoek/%s/docs/%s", onderzoek.id, name));
	}
	function dateAsString(date) {
		return typeof date === "string" ? date : (new Date(date)).toJSON();
	}
	
	function require_v7_export(onderzoek, currentRoute) {
		var doc = getNestedDoc(onderzoek, "V7-export");
		return Promise.resolve(V7.objects.idx[doc._id]).then(function() {
			if(doc.root instanceof Promise) {
				console.log("already requesting V7-export");
				return doc.root;
			} else if(!doc.root || isExpired(onderzoek, doc)) {
				var url = URL + onderzoek.id + "&" + Date.now();
				delete doc.$$loaded;
				return (doc.root = Session.get(url).then(function(resp) {
					console.log("got", url);
					doc.root = resp;
					doc.modified = onderzoek.modified || new Date();
					return V7.objects.save(doc, { delay: false }).then(function() {
						check_loaded(onderzoek, doc, currentRoute);
						return doc;
					});
				}));
			}
			check_loaded(onderzoek, doc, currentRoute);
			return doc;
		});
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
				var menu = V7.objects.get("/menu");
				var comp = e.target.up(".page").f7Component;
				var route = e.target.up(".page").f7Page.route;
				var index = anchorIndex(route);
				if(index !== -1) {
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
				
				$$(e.target.meOrUp("a")).toggleClass("button-fill");
			}
		},
		on: { 
			pageInit(e) {
				var currentRoute = js.get("detail.router.currentRoute", e);
				var key = js.get("detail.router.currentRoute.query.key", e);
				var onderzoek = EM.get("Onderzoek", key);
				
				f7a.virtualList.create({
					el: e.target.qs(".list.fotos.virtual-list"),
			        cache: false,
					items: onderzoek.fotos || [],
			        itemTemplate: fotos.templates.infinite_onderzoek,
			        height: 98,
			        cols: 4
				});
			} 
		},
		data: function() {
			var onderzoek = EM.get("Onderzoek", this.$route.query.key);
			require_v7_export(onderzoek, this.$route);
			return js.mixIn({
				loading: isLoading(onderzoek),
				anchored: isAnchored(this.$route),
				unique: Date.now()
			}, onderzoek);
		},
		template: template,
			require_v7_export: require_v7_export
	};
	
});