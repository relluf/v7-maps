define(function(require) {

	var URL = "/office-rest/action/profielen?view=V7-export&id=";
	
	var template = require("template7!./template.html");
	var Session = require("veldoffice/Session");
	var EM = require("veldoffice/EM");
	var on = require("on");
	
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
			".ptr-content ptr:refresh": function(e) {
				setTimeout(() => f7a.ptr.done(e.target), 1000);
			},
			".show-on-map click": function(e) {
				var pageEl = e.target.up(".page");
				var key = js.get("f7Page.route.query.key", pageEl);
				V7.showOnMap("Onderzoek", EM.get("Onderzoek", key));
			}
		},
		on: { 
			pageInit(e) {
				var key = js.get("detail.router.currentRoute.query.key", e);
				var onderzoek = EM.get("Onderzoek", key);
				getData(e, onderzoek);
			} 
		},
		data: function() {
			return EM.get("Onderzoek", this.$route.query.key);
		},
		template: template
	};
	
});