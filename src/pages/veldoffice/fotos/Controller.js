define(function(require) {

	var EM = require("veldoffice/EM");
	var listItemTemplate = require("template7!./list-item.html");
	
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
	
	
//	EVENTS
	function data() {
		
	}
	function pageInit(e) {
		
	}

	return {
		data: data,
		on: { pageInit: pageInit }	
	};
});


