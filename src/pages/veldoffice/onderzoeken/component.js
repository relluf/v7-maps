define(function(require) {
	
	var infinite_tmpl = require("template7!./infinite-template.html");
	var template = require("text!./template.html");
	var module = require("module");
	
	var Session = require("veldoffice/Session");
	var EM = require("veldoffice/EM");
	var moment = require("moment");

	var ITEM_HEIGHT = 114;
	var PAGE_SIZE = 50;
	var arr = []; // TODO should be refactored out to a virtualList "local" variable
	var pager = { // TODO refractor to a EM.Pager class or something
		path: module.id + "/queries/recent/pages/",
		requesting: {},
		load: function(page) {
			if(this.requesting[page] instanceof Promise) {
				return this.requesting[page];
			}
			
			var me = this, work = [getMostRecentModified(), getIndex(), 
				V7.objects.fetch(this.path + page)];
				
			return (this.requesting[page] = Promise.all(work).then(function(values) {
				var mostRecent_modified = values[0].getTime();
				var index_modified = new Date(values[1].modified || 0).getTime();
				var page_modified = new Date(values[2].modified || 0).getTime();
				var result = values[2];
				
				console.log("Pager.load()", mostRecent_modified - index_modified,
					me.path, { most_recent: new Date(mostRecent_modified), 
						modified: new Date(index_modified) });
				
				delete me.requesting[page];

				if(result.data) {
					if(page === 0) {
						if(mostRecent_modified > page_modified) {
							console.log("first page expired", page);
							delete result.data;
							delete result.modified;
						}
					} else {
						if(index_modified > page_modified) {
							console.log("page expired", page);
							delete result.data;
							delete result.modified;
						}
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

	function getMostRecentModified() {
		if(!arguments.callee.promise) {
			arguments.callee.promise = EM.query("Onderzoek", "max:modified")
				.then(function(obj) {
					obj = obj[0] || {};
					return new Date(obj['max:modified']);
				});
		}
		return arguments.callee.promise;
	}	
	function getIndex(name) {
		name = name || (pager.path + "0");
		
		var index = V7.objects.get(name);
		if(!index.modified) {
			return V7.objects.fetch(name).then(function() {
				// index.modified = new Date(index.modified || Date.now());
				return index;
			});
		} else if(!(index.modified instanceof Date)) {
			// index.modified = new Date(index.modified);
		}
		return Promise.resolve(index);
	}

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
	function queryPage(page) {
		return Promise.all([
			EM.query("Onderzoek", [
					"countdistinct:[outer]fotos.id count_fotos",
					"countdistinct:[outer]meetpunten.id count_meetpunten",
					// "countdistinct:[outer]labopdrachten.id count_labopdrachten",
					"[outer]bedrijf.naam bedrijf_naam", 
					"id", "naam", "projectcode", "contour",
					"created", "modified", "status", "methode"
				], {
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
			page_current = list ? list.listHeight / ITEM_HEIGHT / PAGE_SIZE : 0;
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
		delete getMostRecentModified.promise;
		return getNextPage(e, 0);
	}
	
	function pageInit(e) {
		$$(".search-on-server", e.target).addClass("display-none");
		e.target.up(".view").down(".searchbar").on({
			"searchbar:enable": function(e) {
				$$(".search-on-server").removeClass("display-none");
			},
			"searchbar:disable": function(e) {
				$$(".search-on-server").addClass("display-none");
			}
		});
		getFirstPage(e).then(function() { 
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
	
	return { 
		bindings: {
			".infinite-scroll-content infinite": function(e) {
				var page = e.target.up(".page");
				if(!page.hasOwnProperty("$infinite-busy")) {
					page['$infinite-busy'] = Date.now();
					getNextPage(e).then(function() {
						delete page['$infinite-busy'];
						f7a.virtualList.get(page.qs(".virtual-list")).update();
					});
				}
			},
			".ptr-content ptr:refresh": function(e) {
				var sb = f7a.searchbar.get(e.target.up(".view").down(".searchbar"));
				if(sb.enabled) {
					// f7a.ptr.done(ptr);	
					// return;
				}
	
				getFirstPage(e).then(function(res) {
					arr.splice.apply(arr, [0, arr.length].concat(res));
					f7a.ptr.done(e.target);	
					f7a.virtualList.get(e.target.up(".page").qs(".virtual-list")).update(true);
				});
			}
		},
		template: template, on: { pageInit: pageInit } };
});