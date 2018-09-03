define(function(require) {
	
	var infinite_tmpl = require("template7!./infinite-template.html");
	var template = require("text!./template.html");
	
	var Session = require("veldoffice/Session");
	var EM = require("veldoffice/EM");
	var moment = require("moment");
	
	var cache = window['pages/investigations/cache'] || (window['pages/investigations/cache'] = { pages: [] });
	var arr = []; // should be redfactored out to a virtualList "local" variable

	var ITEM_HEIGHT = 114;
	var PAGE_SIZE = 50;

	function match(onderzoek, query) {
		return query.split(" ").some(function(query) {
			if(0 && query.indexOf("count-meetpunt") === 0) {
				return onderzoek.count_valid_meetpunten >= parseInt(query.split(":")[1], 10);
			}
			
			return ["projectcode", "naam", "bedrijf"].some(function(key) {
				var str = onderzoek[key];
				return typeof str === "string" 
					&& str.toLowerCase().indexOf(query.toLowerCase()) !== -1;
			});
		});
	}
	function resetCache() {
		cache.pages = [];
	}
	function getPage(page) {
		// V7.objects.get("investigations/infinite-page", page);
		if(page < cache.pages.length) {
			return Promise.resolve(cache.pages[page]);
		}

		return Promise.all([
			EM.query("Onderzoek", [
					"countdistinct:[outer]fotos.id count_fotos",
					"countdistinct:[outer]meetpunten.id count_meetpunten",
					// "countdistinct:[outer]labopdrachten.id count_labopdrachten",
					"[outer]bedrijf.naam bedrijf_naam", 
					"id", "naam", "projectcode", "contour",
					"created", "modified", "status", "methode"
				], {
					page: [page, PAGE_SIZE],
					groupBy: "id", 
					orderBy: "modified desc",
					// having: ["countdistinct:[outer]meetpunten.id"]
				}).then(function(res) {
					return cache.pages[page] = res;
				}),
			
			EM.query("Onderzoek", "id,count:meetpunten.id count_meetpunten_with_coords", { orderBy:"modified desc", groupBy: "id", where:["and", ["isnotnull", "meetpunten.xcoord"], ["isnotnull", "meetpunten.ycoord"]], page: [page, PAGE_SIZE]})
			
		]).then(function(results) {
			return results[0];
		})
			
	}
	function getNextPage(e, page_current) { 
		// e is pageInit-event
		
		if(page_current === undefined) {
			var list = f7a.virtualList.get($$(".virtual-list", e.target));
			page_current = list ? list.listHeight / ITEM_HEIGHT / PAGE_SIZE : 0;
		}

		var pages = cache.pages; // hold on to page cache to see...
		return getPage(page_current).then(function(res) {
			if(pages === cache.pages) { // ...whether this response should be ignored
				res.forEach(_ => { 
					_.page = page_current; 
					_.modified_moment = moment(_.modified).calendar();
				});
				arr.splice.apply(arr, [arr.length, 0].concat(res));
			} else {
				throw new Error("Page was canceled");
			}
			return res;
		});
	}
	function getFirstPage(e) {
		return getNextPage(e, 0);
	}
	
	function pageInit(e) {
		var ptr = e.target.qs(".ptr-content");
		
		$$(".search-on-server", e.target).addClass("display-none");

		ptr.on("ptr:refresh", function(e) {
			var sb = f7a.searchbar.get(e.target.up(".view").down(".searchbar"));
			if(sb.enabled) {
				// f7a.ptr.done(ptr);	
				// return;
			}

			resetCache();
			getFirstPage(e).then(function(res) {
				arr.splice.apply(arr, [0, arr.length].concat(res));
				f7a.ptr.done(ptr);	
				f7a.virtualList.get(e.target.qs(".virtual-list")).update(true);
			});
		});
		e.target.up(".view").down(".searchbar").on({
			"searchbar:enable": function(e) {
				$$(".search-on-server").removeClass("display-none");
			},
			"searchbar:disable": function(e) {
				$$(".search-on-server").addClass("display-none");
			}
		})
		// e.target.qs(".virtual-list").on("click", function(e) {
		// 	var li = e.target.up("li");
		// 	if(li) {
		// 		V7.router.navigate("main", "/investigation?key=" + li.dataset.key);
		// 	}
		// });
		e.target.qs(".infinite-scroll-content").on("infinite", function() {
			if(!e.target.hasOwnProperty("infinite-busy")) {
				e.target['infinite-busy'] = Date.now();
				getNextPage(e).then(function() {
					delete e.target['infinite-busy'];
					f7a.virtualList.get(e.target.qs(".virtual-list")).update();
				});
			}
		});
		
		getNextPage(e).then(function() { 
			f7a.virtualList.create({
				el: e.target.qs(".virtual-list"),
		    	cache: true,
		    	rowsAfter: 10,
		    	rowsBefore: 10,
		        items: arr,
		        itemTemplate: infinite_tmpl,
		        searchAll: function(query, items) {
		            var found = [];
		            for (var i = 0; i < items.length; i++) {
		                if (query.trim() === '' || match(items[i], query)) {
		                    found.push(i);
		                }
		            }
		            return found;
		        },
		        height: ITEM_HEIGHT
		    });
		});
	}
	
	return { template: template, on: { pageInit: pageInit } };

});