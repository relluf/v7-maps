define(function(require) {
	
	// require("stylesheet!node_modules/font-awesome/css/font-awesome.css");
	require("stylesheet!pages/styles.less");
	require("app/hotkeys");
	
	require("leaflet");
	require("pouchdb");
	require("moment");
	require("blocks-js");
	require("font-awesome");

	var Framework7 = require("framework7");
	var Session = require("veldoffice/Session");
	var EM = require("veldoffice/EM");
	var V7 = require("V7");
	
	var Deferred = require("js/Deferred");
	var js = require("js");
	var on = require("on");

	var routes = require("pages/routes");
	var $ = require("jquery");
	
	function req() {
	    if (arguments.length == 1) {
	        try {
	            return require(arguments[0]);
	        } catch(e) {}
	    }
	    
	    var d = new Deferred();
	    require.apply(this, [js.copy_args(arguments),
	        function () {
	            d.callback.apply(d, js.copy_args(arguments));
	        },
	        function (err) {
	            d.errback(err);
	        }
	    ]);
	    return d;
	}

	window.EM = EM;
	window.Session = Session;
	window.$ = $;
	window.$$ = Dom7;
	window.req = req;
	// window.V7 = V7;

	/* Make life easier */
	var qsa = Element.prototype.querySelectorAll;
	Element.prototype.meOrUp = function(nodeName) {
		if(this.nodeName.toLowerCase() === nodeName.toLowerCase()) return this;
		return this.up(nodeName);
	};
	Element.prototype.up = function(selector) {
		
		if(arguments.length === 0) {
			return this.parentNode;
		}

		function distanceToParent(node, parent) {
			var r = 1;
			node = node.parentNode;
			while(node && node !== parent) {
				node = node.parentNode;
				r++;
			}
			return node === parent ? r : 0;
		}
		
		var all = document.querySelectorAll(selector), me = this;
		return Array.prototype.slice.apply(all, [0]).map(function(node) { 
			return {node: node, distance: distanceToParent(me, node)};
		}).filter(function(result) {
			return result.distance > 0;
		}).sort(function(i1, i2) {
			return i1.distance - i2.distance;
		}).map(function(i1) {
			return i1.node;
		})[0] || null;
	};
	Element.prototype.down = function(selector) {
		return this.querySelector(selector);
	};
	Element.prototype.qsa = function() {
		return Array.prototype.slice.call(qsa.apply(this, arguments), [0]);
	};
	Element.prototype.qs = Element.prototype.querySelector;
	Element.prototype.on = function() {
		var args = js.copy_args(arguments); args.unshift(this);
		return on.apply(this, args);
	};
	Element.prototype.once = function(name, f) {
		this.addEventListener(name, function() {
			this.removeEventListener(name, arguments.callee);
			f.apply(this, arguments);
		});
	};
	Element.prototype.bindAll = function(bindings) {
		var f, name, target = this;
		for(var selector in bindings) {
			f = bindings[selector];
			if(typeof f === "function") {
				selector = selector.split(" ");
				name = selector.pop();
				$(selector.join(" ") || target, target).on(name, f);
			}
		}
	};

	var app = new Framework7({
		root: "#app",
		panel: { swipe: "left" },
		panels3d: { enabled: true },
		routes: routes,
		theme: (location.search.split('laf=')[1]||'').split('&')[0] || "auto"
	});    	
	var mainView = app.views.main;
	var leftView = app.views.left = app.views.create(".view-left", { 
		url: "/menu-fix",
		stackPages: true
	});

	window.f7a = app;
	mainView.router.navigate("/map", { animate: false });
	leftView.router.navigate("/menu", { animate: false });

	if(window.location.toString().endsWith("cordova") || window.location.toString().endsWith("wash")) {
		require(["script!node_modules/v7-cordova/cordova.js"]);
		
		document.addEventListener("deviceready", function() {
	    	cordova.require("cordova-plugin-statusbar.statusbar")
	    		.styleDefault();
	   	});
	}
	
	app.panel.left.on("open", function() { localStorage.setItem("v7.left-panel-opened", true ) });
	app.panel.left.on("close", function() { localStorage.setItem("v7.left-panel-opened", false)});
	if(localStorage.getItem("v7.left-panel-opened") === "true") {
		app.panel.left.open(false);
	}
	// app.statusbar.hide();
	
	// initialize left when session info is available
	Session.info().then(function(res) {
		V7.objects.get("/menu").session = res;
		if(V7.objects.changed("/menu")) {
			V7.objects.save("/menu"); // TODO Hmmz, could this be automatic? pagein/out/refresh
		}
	});
	Session.refresh().then(function() {
		V7.sessionNeeded();
	});

	function hasClass(node, cl) {
		return node.classList.contains(cl);
	}
    function checkBlockSwipe(e) {
		var node = e.target, prevent = false;
    	if(e.touches) node = e.touches[0].target;
    	
		while(node !== document && node !== null && prevent === false) {
			prevent = hasClass(node, "block-swipe");
			if(hasClass(node, "swipe-handle")) { break; }
			node = node.parentNode;
		}
		window.TouchEvent && (TouchEvent.prototype.f7PreventSwipePanel = prevent);
		window.MouseEvent && (MouseEvent.prototype.f7PreventSwipePanel = prevent);
    }
    
	document.addEventListener("ontouchstart" in window ? 
		"touchstart" : "mousedown", checkBlockSwipe);
	
});