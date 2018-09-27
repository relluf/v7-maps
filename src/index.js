// var veldoffice_js = "node_modules/veldoffice-js/src";
var veldoffice_js = "/home/Workspaces/veldapps.com/veldoffice-js/src";
require.config({ paths: {
	"backbone": "node_modules/backbone/backbone",
	"underscore": "node_modules/underscore/underscore",
    // "pouchdb": "bower_components/pouchdb/dist/pouchdb",
    // "argsarray": "node_modules/argsarray/index",
	"jquery": "node_modules/jquery/dist/jquery",
    "less": "bower_components/less/dist/less",
    "moment": "node_modules/moment",

	"text": "node_modules/cavalion-js/src/text",
	"stylesheet": "node_modules/cavalion-js/src/stylesheet",
	"script": "node_modules/cavalion-js/src/script",

	"js": "node_modules/cavalion-js/src/js",
	"on": "node_modules/cavalion-js/src/on",
	"data": "node_modules/cavalion-js/src/data",
	"util": "node_modules/cavalion-js/src/util",
	"locale": "node_modules/cavalion-js/src/locale",

	"entities": "node_modules/cavalion-js/src/entities",
	"vcl": "node_modules/cavalion-vcl/src/",
	"blocks": "node_modules/cavalion-blocks/src/",
	
	/* veldapps.com */		
	"veldapps": veldoffice_js + "/veldapps.com",
	"veldoffice": veldoffice_js + "/veldapps.com/veldoffice",
	"vcl/veldoffice": veldoffice_js + "/veldapps.com/veldoffice/vcl-veldoffice",
	/*- veldoffice/3rd party */
	"proj4": veldoffice_js + "/proj4js.org/proj4-src",
	"epsg": veldoffice_js + "/proj4js.org/epsg",
	"leaflet": veldoffice_js + "/leafletjs.com"
}});

define("app/hotkeys", ["util/HotkeyManager"], function(HKM) {

	/* toggle-menu */
	HKM.register("Escape", {
		type: "keydown",
		callback: function(e) {
			if(f7a.panel.left.opened) {
				f7a.panel.left.close();
			} else {
				f7a.panel.left.open();
			}
		}
	});

});
define("moment", ["moment/moment", "moment/locale/nl"], function(moment) {
	moment.locale("nl");
	return moment;
});
define("framework7/plugins/auto-back-title", function() {
	
	var selectors = {
		back: ".navbar .back.link span",
		title: ".title"
	};

    /*- Link title of back button to title of page */
    var previous;
    document.addEventListener("page:mounted", function (e) {
    	if(e.detail.direction !== "forward") {
			// console.log("page:mounted - no direction", e.detail);
    	} else {
    		previous = e.detail.pageFrom;
    	}

    	if(!previous) return;
    	
    	var current = e.detail;
        var back = current.navbarEl && current.navbarEl.down(selectors.back);

        if(back && previous.navbarEl) {
            back.innerHTML = previous.navbarEl.down(selectors.title).innerHTML;
        }
    });
    
    return selectors;
});
define("framework7/plugins/esc-is-back", ["Element"], function() {  // Element?
	var selectors = {
		back: ".view-left .navbar .navbar-current .left a.back.link",
	};
	document.addEventListener("keyup", function(e) {
		if(e.keyCode === 27) {
			e.preventDefault();
			document.qsa(selectors.back).forEach(function(el, index) {
				if(index === 0) el.click();
			});
		}
	});
	return selectors;
});
define("framework7", function(require) { 
	var Framework7 = require("node_modules/framework7/js/framework7");
	var Panels = require("node_modules/framework7-plugin-3d-panels/dist/framework7.3dpanels");
	
	require("framework7/plugins/auto-back-title");
	require("stylesheet!node_modules/framework7/css/framework7.min.css");
	require("stylesheet!node_modules/framework7-icons/css/framework7-icons.css");
	Framework7.use(Panels);

	return Framework7; 
});
define("template7", ["framework7"], function() {

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
				console.warn("Factory " + str[2] + " not registered for " + str[1]);
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

	return {
		load: function(name, parentRequire, load, config) {
			/** @see http://requirejs.org/docs/plugins.html#apiload */
			parentRequire(["text!" + name], function(source) {
				load(Template7.compile(source));
			});
		}
	};
});

define("pouchdb", [
	"./bower_components/pouchdb/dist/pouchdb",
    "./bower_components/pouchdb-find/dist/pouchdb.find"
], function(PouchDB, Find) {

	PouchDB.plugin(Find);

	return PouchDB;
});

define("font-awesome", ["stylesheet!node_modules/@fortawesome/fontawesome-free/css/all.css"], function(fa) {
	return fa;
});
define("leaflet", ["leaflet/leaflet-default"], function(leaflet) { return leaflet; });
define("blocks-js", ["blocks/Blocks", "blocks/Factory"], function(Blocks, Factory) {
	// TODO Refactor to blocks/Superblock?
	define("vcl/Component-parentIsOwner", ["require", "js/defineClass", "vcl/Component"], function (require, ComponentPIO, Component) {
		return (ComponentPIO = ComponentPIO(require, {
			inherits: Component,
			prototype: {
				setParentComponent: function(value) {
					this.setOwner(value);
				}
			}
		}));
	});	
	return Blocks;
});

window.locale_base = "locales/";

require(["moment", "moment/locale/nl", "locale!en-US", "locale!du-NL"], function(moment, nl) {
	var locale = localStorage.getItem("v7.locale");
	if(locale === null) {
		localStorage.setItem("v7.locale", (locale = "du-NL"));
	}
	
	if(locale === "du-NL") {
	    moment.locale("nl");
		window.locale.loc = "du-NL";
	} else {//if(locale === "en-US") {
		// moment.locale("")
		window.locale.loc = "en-US";
	}

	require(["framework7", "leaflet"], function(Framework7, leaflet) {
		
		if(Framework7.device.iphoneX === true) {
			document.documentElement.classList.add("iphonex");
		}
		require(["V7"], function(V7) {
			window.V7 = V7; // so that it can be used in pages/.../component.js
			require(["main"]);
		});
	});
});