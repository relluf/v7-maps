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
		// on: {
			// pageInit(e) {
			// 	var onderzoek = EM.get("Onderzoek", this.$route.query.key);
			// 	getData(e, onderzoek);
				
			// 	var ptr = e.target.qs(".ptr-content");
			// 	ptr.on("ptr:refresh", function(e) {
			// 		setTimeout(() => f7a.ptr.done(ptr), 1000);
			// 	});
				
			// 	on(e.target.qsa(".show-on-map"), "click", function(e) {
			// 		V7.showOnMap("Onderzoek", onderzoek);
			// 		// TODO
			// 	});
				
			// }
		// },
		data: function() {
			return EM.get("Meetpunt", this.$route.query.key);
		},
		template: template
	};
	
});