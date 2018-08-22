define(function(require) {
	
	require("stylesheet!node_modules/font-awesome/css/font-awesome.css");
	require("stylesheet!pages/styles.less");
	require("app/hotkeys");

	var Framework7 = require("framework7");
	var Session = require("veldoffice/Session");
	var EM = require("veldoffice/EM");
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
	}
	

	/* Make life easier */
	var qsa = Element.prototype.querySelectorAll;
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

	Template7.registerHelper("l", function (str) {
		// locale() helper
		if(arguments.length > 1) {
			str = js.copy_args(arguments);
			
			if(str[0] !== ">") {
				str.pop();
				str = str.join("");
			} else {
				str.shift(); // [thisObj, entity, factory, options]
				var f = window.locale(String.format("%s.factories/%s", str[1], str[2]));
				if(typeof f === "function") {
					return f.apply(str[0], [str[1], str[2], str[3]]);
				}
			}
		}
		
	    if (typeof str === "function") str = str.call(this);
	    
	    if(typeof window.locale === "function") {
	    	return window.locale(str);
	    }
	    
	    return str;
    });
    Template7.registerHelper("e", function(context, options) {
    	// escapeHtml() helper
    	var joined;
		if(arguments.length > 1) {
			context = js.copy_args(arguments);
			options = context.pop();
			joined = context = context.join(".");
		    context = js.get(context);
		} else {
	    	if (typeof context === "function") context = context.call(this);
		}

		return String.escapeHtml(options.fn(context));
    });
    Template7.registerHelper("w", function(context, options) {
    	// with() helper
    	var joined;
		if(arguments.length > 1) {
			context = js.copy_args(arguments);
			options = context.pop();
			joined = context = context.join("");
			try {
		    	context = eval(context);
		    } catch(e) {
		    	context = js.get(context);
		    }
		}
		
    	if (typeof context === "function") context = context.call(this);

		return options.fn(context);
    });
    Template7.registerHelper("wjs", function(expression, options) {
    	// withjs() helper
        if (typeof expression === "function") { expression = expression.call(this); }
    	
        // 'with': function (context, options) {
        //     if (isFunction(context)) { context = context.call(this); }
        //     return options.fn(context);
        // },
        
        var func;
        if (expression.indexOf('return')>=0) {
            func = '(function(){'+expression+'})';
        }
        else {
            func = '(function(){return ('+expression+')})';
        }
        return options.fn(eval.call(this, func).call(this));
    });

	var app = new Framework7({
		root: "#app",
		panel: { swipe: "left" },
		panels3d: { enabled: true },
		routes: routes,
		theme: "ios"
	});    	
	var mainView = app.views.create(".view-main");
	var leftView = app.views.create(".view-left");

	mainView.router.navigate("/map", { animate: false });

	window.Session = Session;
	window.f7a = app;
	window.$ = $;
	window.req = req;

	if(window.location.toString().endsWith("cordova")) {
		require(["script!../../cordova/cordova.js"]);
		app.statusbar.hide();
	}

	Session.refresh().then(function() {
		// initialize left when session info is available
		Session.info().then(function() {
			leftView.router.navigate("/menu", { animate: false });
		});
	
		if(!Session.isAuthenticated()) {
			var user = localStorage.getItem("services.veldoffice.user");
			var pass = localStorage.getItem("services.veldoffice.password");
			
			if(user && pass) {
				Session.login(user, pass).then(function() {
					if(!Session.isAuthenticated()) {
						mainView.router.navigate("/login");
					} else {
						Session.info().then(_ => {
							console.log("info", _);	
						});
					}
				});
			} else {
				mainView.router.navigate("/login");
			}
		} else {
			Session.info().then(_ => {
				leftView.router.navigate("/session", { animate: false });
			});
		}
	});

	// leftView.router.navigate("/session", { animate: false });
	// document.documentElement.classList.remove("md");
	// document.documentElement.classList.add("ios");
	
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
	
	document.addEventListener("deviceready", function() {
    	var sb = cordova.require("cordova-plugin-statusbar.statusbar");
    	sb.styleDefault();
    	
    	document.addEventListener("touchmove", function(e) {
    		// console.log(e.touches.length);	
    	}, true);
    	
   	});
});
