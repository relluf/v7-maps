define(function(require) {
	
	var infinite_tmpl = require("template7!./infinite-template.html");
	var template = require("text!./template.html");
	var module = require("module");
	
	var Session = require("veldoffice/Session");
	var EM = require("veldoffice/EM");
	var moment = require("moment");

	var ATTRIBUTES = [
		"countdistinct:[outer]fotos.id count_fotos",
		"countdistinct:[outer]meetpunten.id count_meetpunten",
		// "countdistinct:[outer]labopdrachten.id count_labopdrachten",
		"[outer]bedrijf.naam bedrijf_naam", 
		"id", "naam", "projectcode", "contour",
		"created", "modified", "status", "methode"
	];
	var ITEM_HEIGHT = 114;
	var PAGE_SIZE = 50;
	var arr = []; // TODO should be refactored out to a virtualList "local" variable (or should it? sharing the same array over all lists isn't that bad)
	
	var mostRecent_modified = 0;
	var pager = { // TODO refactor to a EM.Pager class or something
		path: module.id + "/queries/recent/pages/",
		requesting: {},
		load: function(page) {
			if(this.requesting[page] instanceof Promise) {
				return this.requesting[page];
			}
			
			var me = this;
				
			return (this.requesting[page] = V7.objects.fetch(this.path + page).then(function(result) {
				var page_modified = new Date(result.modified || 0).getTime();
				
				console.log("Pager.load()", mostRecent_modified - page_modified,
					me.path, { most_recent: new Date(mostRecent_modified), 
						modified: new Date(page_modified) });
				
				delete me.requesting[page];

				if(result.data) {
					if(mostRecent_modified > page_modified) {
						console.log("page expired", page);
						delete result.data;
						delete result.modified;
					}
				}
				return result;
			}));
		},
		save: function(page) {
			if(typeof page !== "object") {
				page = V7.objects.get(this.path + page);
			}
			
			return getMostRecentModified().then(function(mrm) {
				if(!page.modified) {
					console.log(">>>> page modified SET", page);
					page.modified = new Date(mrm);
				}
				return V7.objects.save(page, { delay: false });
			});
		}
	};
	var pager_coords = {
		path: module.id + "/queries/recent(with-coords)/pages/",
		requesting: {},
		load: pager.load,
		save: pager.save
	};
	var pager_search = {
		path_: module.id + "/queries/recent[search=%s]/pages/",
		path: "",
		requesting: {},
		load: pager.load,
		save: pager.save
	};

	function queryPage(page) {
		return Promise.all([
			EM.query("Onderzoek", ATTRIBUTES, {
					page: [page, PAGE_SIZE, pager],
					groupBy: "id", 
					orderBy: "modified desc",
					// having: ["countdistinct:[outer]meetpunten.id"]
				}),
			
			EM.query("Onderzoek", "id,count:meetpunten.id count_meetpunten_with_coords", { 
				page: [page, PAGE_SIZE, pager_coords],
				orderBy:"modified desc", 
				groupBy: "id", 
				where:["and", ["isnotnull", "meetpunten.xcoord"], 
					["isnotnull", "meetpunten.ycoord"]]
			})
			
		]).then(function(results) {
			return results[0];
		});	
	}
	function getNextPage(e, page_current) { 
		// e is pageInit-event
		if(page_current === undefined) {
			var list = f7a.virtualList.get($$(".virtual-list", e.target));
			page_current = list ? parseInt(list.listHeight / ITEM_HEIGHT / PAGE_SIZE) : 0;
		}

		return queryPage(page_current).then(function(res) {
			res.forEach(_ => { 
				_.page = page_current; 
				_.modified_moment = moment(_.modified).calendar();
			});
			arr.splice.apply(arr, [arr.length, 0].concat(res));
			return res;
		});
	}
	function getFirstPage(e) {
		return getNextPage(e, 0);
	}
	
	function match(onderzoek, query) {
		return query.split(" ").some(function(query) {
			if(0 && query.indexOf("count-meetpunt") === 0) {
				return onderzoek.count_valid_meetpunten >= parseInt(query.split(":")[1], 10);
			}
			return ["projectcode", "naam", "bedrijf_naam"].some(function(key) {
				var str = "" + onderzoek[key];
				return typeof str === "string" 
					&& str.toLowerCase().indexOf(query.toLowerCase()) !== -1;
			});
		});
	}
	function getFirstSearchPage(terms) {
		var term = terms[0];
		return Promise.all([
			EM.query("Onderzoek", ATTRIBUTES, { 
				where: ["and", 
					["or", ["contains", "naam", term], ["contains", "projectcode", term]],
					["lt", "modified", Date.now()] // TODO
				],
				// page: [page, PAGE_SIZE, pager_coords],
				groupBy: "id",
				orderBy: "modified desc"
			}).then(function(res) {
				res.forEach(_ => { 
					_.page = 0; 
					_.modified_moment = moment(_.modified).calendar();
				});
				return res;
			}),

			EM.query("Onderzoek", "id,count:meetpunten.id count_meetpunten_with_coords", { 
				where: ["and", 
					["isnotnull", "meetpunten.xcoord"], 
					// ["isnotnull", "meetpunten.ycoord"],
					// ["lt", "modified", Date.now()] // TODO
					["or", ["contains", "naam", term], ["contains", "projectcode", term]]
				],
				// page: [page, PAGE_SIZE, pager_coords],
				orderBy:"modified desc", 
				groupBy: "id"
			})
			
		]).then(function(values) {
			return values[0];
		});
	}
	
	function getMostRecentModified() {
		var callee = getMostRecentModified;
		if(!callee.promise) {
			callee.promise = EM.query("Onderzoek", "max:modified")
				.then(function(obj) {
					obj = obj[0] || {};
					// delete callee.promise;
					return (mostRecent_modified = new Date(obj['max:modified']).getTime());
				});
		}
		return callee.promise;
	}	
	function pageInit(e) {
		getFirstPage(e).then(function() { 
			var vl = f7a.virtualList.create({
				el: e.target.qs(".virtual-list"),
		    	// cache: true,
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
		    // refresh
			getMostRecentModified().then(function() {
				return getFirstPage(e).then(function(res) {
					arr.splice.apply(arr, [0, arr.length].concat(res));
					vl.update(true);
				});
			});
		});
	}
	
	return { 
		bindings: {
			navbar: {
				".searchbar searchbar:disable": function(e) {
					var vl = f7a.virtualList.get(
						e.target.up(".view")
							.down(".page-current .virtual-list")
					);
					vl.replaceAllItems(arr);
					vl.update();
				},
				".searchbar searchbar:clear": function(e) {
				},
				".searchbar searchbar:search": function(e) {
if(e.target.$blocked) {
	return;
}
var page = e.target.up(".view").down(".page-current");
					// this = form-element
					var term = this.down("input").value;
					var terms = term.split(" ").filter(_ => _.length > 0);
					
					if(!term.length) {
						if(this.$timeout) window.clearTimeout(this.$timeout);
						delete this.$timeout;
						// TODO more clean up?
						console.log("more cleanup?");
						return;
					}
					
					if(this.$timeout) window.clearTimeout(this.$timeout);
					this.$timeout = window.setTimeout(function() {
$$(page.down(".preloader.searcher")).removeClass("display-none");
						getFirstSearchPage(terms).then(function(res) {
$$(page.down(".preloader.searcher")).addClass("display-none");
							var vl = f7a.virtualList.get(page.down(".virtual-list"));
							vl.replaceAllItems(res);
							vl.update();
e.target.$blocked = true;
							var sb = f7a.searchbar.get(e.target), q = sb.previousQuery;
							sb.search(q, true);
e.target.$blocked = false;
						});
						
						
						
					}, 500);
					
				}
			},
			".infinite-scroll-content infinite": function(e) {
				var page = e.target.up(".page");
				var view = e.target.up(".view");
				var sb = f7a.searchbar.get(view.down(".searchbar"));
				if(!sb.enabled) {
					if(!page.hasOwnProperty("$infinite-busy")) {
						page['$infinite-busy'] = Date.now();
						getNextPage(e).then(function() {
							delete page['$infinite-busy'];
							f7a.virtualList.get(page.qs(".virtual-list")).update();
						});
					}
				} else {
					
					console.log("!!! search-infinite !!!! ");
				}
			},
			".ptr-content ptr:refresh": function(e) {
				var sb = f7a.searchbar.get(e.target.up(".view").down(".searchbar"));
				if(sb.enabled) {
					// f7a.ptr.done(ptr);	
					// return;
				}
				
				delete getMostRecentModified.promise;
				getMostRecentModified().then(function() {
					return getFirstPage(e).then(function(res) {
						arr.splice.apply(arr, [0, arr.length].concat(res));
						f7a.ptr.done(e.target);	
						f7a.virtualList.get(e.target.up(".page").qs(".virtual-list")).update(true);
					});
				});
				
			}
		},
		template: template, on: { pageInit: pageInit } };
});