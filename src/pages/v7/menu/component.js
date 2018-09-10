define(function(require) {
	
	var template = require("template7!./template.html");
	var Session = require("veldoffice/Session");
	var Framework7 = require("framework7");

	V7.objects.on("/menu", "saved", function() {
		// console.log("/menu need refresh (saved)");
		V7.router.refresh("/menu");	
	});
	V7.objects.on("/menu", "fetched", function(menu) {
		// console.log("/menu need refresh (fetched)");
		menu.anchors = menu.anchors || [];
		V7.router.refresh("/menu");	
	});

	return { 
		data() {
			var menu = V7.objects.get("/menu");
			var name = js.get("session.name", menu) || "&nbsp;";
			var company = js.get("session.bedrijf.naam", menu) || "&nbsp;";
			
			return {
				user:  { name: name, company: company },
				anchors: menu.anchors || [],
				language: menu.language || "du-NL"
			};
		},
		template: template, 
		bindings: {
 			".page-content infinite": function() {
				console.log("infinite", { 'this': this, args: arguments });
			},
			".ptr-content ptr:refresh": function(e) {
				Session.refresh().then(function() {
					f7a.ptr.done(e.target);
					setTimeout(function() {
						V7.sessionNeeded();
						V7.refreshMenu(); //?
					}, 500);
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
			".button.foto click": function(e) {
				V7.takePhoto();	
				$$(e.target).toggleClass("button-fill");
			},
			".button.meetpunt click": function(e) {
				V7.trackLocation();	// track/input/grabPhoto/Location/Scan/Audio/Video
				$$(e.target).toggleClass("button-fill");
			},
			".button.scan click": function(e) {
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
		}
	};
});