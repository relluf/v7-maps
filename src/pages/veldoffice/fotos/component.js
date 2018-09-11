define(function(require) {
	
	var infinite_tmpl = require("template7!./infinite-template.html");
	var template = require("text!./template.html");
	var module = require("module");
	
	var Session = require("veldoffice/Session");
	var EM = require("veldoffice/EM");
	var moment = require("moment");

	var ATTRIBUTES = [
		"id", "onderzoek.id onderzoek", "modified"
	];
	var ITEM_HEIGHT = 98;
	var COLS = 4;
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

	function queryPage(page) {
		return Promise.all([
			EM.query("Foto", ATTRIBUTES, {
					page: [page, PAGE_SIZE, pager],
					orderBy: "modified desc"
				})
		]).then(function(results) {
			return results[0];
		});	
	}
	function getNextPage(e, page_current) { 
		// e is pageInit-event
		if(page_current === undefined) {
			var list = f7a.virtualList.get($$(".virtual-list", e.target));
			page_current = list ? list.listHeight / (ITEM_HEIGHT/COLS) / PAGE_SIZE : 0;
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

	function getMostRecentModified() {
		var callee = getMostRecentModified;
		if(!callee.promise) {
			callee.promise = EM.query("Foto", "max:modified")
				.then(function(obj) {
					obj = obj[0] || {};
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
		    	rowsAfter: 30,
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
		        height: ITEM_HEIGHT,
		        cols: COLS
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
			".infinite-scroll-content infinite": function(e) {
				var page = e.target.up(".page");
				// var view = e.target.up(".view");
				// var sb = f7a.searchbar.get(view.down(".searchbar"));
				// if(!sb.enabled) {
					if(!page.hasOwnProperty("$infinite-busy")) {
						page['$infinite-busy'] = Date.now();
						getNextPage(e).then(function() {
							delete page['$infinite-busy'];
							f7a.virtualList.get(page.qs(".virtual-list")).update();
						});
					}
				// } else {
					
				// 	console.log("!!! search-infinite !!!! ");
				// }
			},
			".ptr-content ptr:refresh": function(e) {
				// var sb = f7a.searchbar.get(e.target.up(".view").down(".searchbar"));
				// if(sb.enabled) {
				// 	// f7a.ptr.done(ptr);	
				// 	// return;
				// }
				
				delete getMostRecentModified.promise;
				getMostRecentModified().then(function() {
					return getFirstPage(e).then(function(res) {
						arr.splice.apply(arr, [0, arr.length].concat(res));
						f7a.ptr.done(e.target);	
						f7a.virtualList.get(e.target.up(".page").qs(".virtual-list")).update(true);
					});
				});
				
			},
			".list.fotos click": function(e) {
				var img = e.target.up("li").down("img");
				var f = locale("Foto.factories/src");
				var photos = arr.map(_ => f.apply(_, []));
				var index = photos.indexOf(img.dataset.srcFullres);
				var pb = f7a.photoBrowser.create({
					type: "standalone",
					theme: "dark",
					photos: photos,
					backLinkText: "",
					navbarOfText: locale("Foto.navbarOfText")
				});
				pb.open(index);
			}
		},
		template: template, on: { pageInit: pageInit } };
});