define(function(require) {
	
	var template = require("template7!./template.html");
	var Session = require("veldoffice/Session");
	var Framework7 = require("framework7");
	var EM = require("veldoffice/EM");
	var V7 = require("V7");
	
	var state, defaults = {
		_id: "/menu", anchors: [],
		User: { name: "&nbsp;", company: "&nbsp;" }
	};
	var bindings = {
		data() {
			// MAJOR TODO, spagetti stuff
			function data_getUser() {
				var info = Session.info_;
				if(!info || info.then) {
					return (state && state.User) || defaults.User;
				}
				return ((state || defaults).User = { 
					name: info.name, company: info.bedrijf.naam });
			}
			
			var menu = V7.objects.get("/menu");
			menu.User = data_getUser();
			if(!menu.anchors) {
				menu.anchors = [];
			}
			
			V7.objects.save(menu);
			
			return menu;
		},

		".page-content infinite": function() {
			console.log("infinite", { 'this': this, args: arguments });
		},
		".ptr-content ptr:refresh": function(e) {
			state = undefined;
			Session.refresh().then(function() {
				f7a.ptr.done(e.target);
				V7.sessionNeeded();
				V7.refreshMenu(); //?
			});
		},
		".link.logout click": function() {
			new Framework7.Dialog(f7a, {
				title: locale("Confirm"),
				text: locale("AreYouSureToLogout"),
				buttons: [{
					text: locale("No"),
					keyCodes: [27]
				}, {
					text: locale("Yes"),
					bold: true,
					keyCodes: [13],
					onClick: function() {
						Session.logout();
						window.location.reload();
					}
				}],
				destroyOnClose: true
			}).open();
		},
		".link.avatar click": function(e) {
			if(!Session.isAuthenticated()) {
				V7.navigate("left", "/login");
			}
		},
		".button-new.foto click": function(e) {
			V7.takePhoto();	
			$$(e.target).toggleClass("button-fill");
		},
		".button-new.meetpunt click": function(e) {
			V7.trackLocation();	// track/input/grabPhoto/Location/Scan/Audio/Video
			$$(e.target).toggleClass("button-fill");
		},
		".button-new.scan click": function(e) {
			V7.scanCode({flash:"off"}, function() { console.log("ok", arguments) }, function() { console.log("err", arguments) })
			$$(e.target).toggleClass("button-fill");
		},
		".button.rewind click": function(e) {
			history.back();						
		},
		".button.reload click": function(e) {
			location.reload();
		},
		".button.logout click": function(e) {
			require("veldoffice/Session").logout().then(function() {
				localStorage.removeItem("services.veldoffice.autologin");
				location.reload();	
			});
		}
	};

	return { template: template, data: bindings.data, bindings: bindings };
});


