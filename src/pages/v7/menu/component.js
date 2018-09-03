define(function(require) {
	
	var template = require("template7!./template.html");
	
	var Session = require("veldoffice/Session");
	var Framework7 = require("framework7");
	var EM = require("veldoffice/EM");

	var bindings = {
		"page:init": function(e) {
			
			// check session, hook session, keep alive?
			// anchors...
			
			V7.objects.get("v7-menu", function(menu) {
				js.mixIn(menu, { 
					anchors: [{
						html: '<li><a href="/veldoffice/meetpunt?key=10970526" class="item-link item-content">\
							<div class="item-media">\
								<i class="fa fa-fw fa-street-view menu-icon bg-color-yellow"></i>\
							</div>\
							<div class="item-inner">\
								<div class="item-title">\
									<div class="item-header">Meetpunt</div>\
									peilbuis 1\
								</div>\
								<div class="item-after">Bewerk</div>\
							</div>\
						</a></li>'
					}, {
						html: '<li><a href="/veldoffice/onderzoek?key=10970526" class="item-content item-link">\
							<div class="item-media">\
								<i class="fa fa-fw fa-street-view menu-icon bg-color-green "></i>\
							</div>\
							<div class="item-inner">\
								<div class="item-title">\
									<div class="item-header"><div class="" style="font-weight:bold;">2e Nieuwstraat 43-47 te Hilversum</div></div>\
									<div class="item-text" style="max-height:none;">\
										<div>\
											<span class="chip methode">NEN 5104</span>\
											<div class="chip LOPEND"><div class="chip-label">In uitvoering</div></div>\
											<div class="chip show-on-map"><div class="chip-label">Kaart</div></div>\
										</div>\
										<div class="item-summary">\
											<span title="27 foto\'s">\
												<i class="fa fa-camera"></i> 27\
											</span>\
											<span title="11 meetpunten" class="">\
												<i class="fa fa-dot-circle-o"></i> 9 / 11\
												<span style="color:silver; font-size:9pt;"> - Hopman en Peters</span>\
											</span>\
										</div>\
									</div>\
								</div>\
							</div>\
						</a></li>'
					}]
				});
			});
		},
		".page-content infinite": function() {
			console.log("infinite", { 'this': this, args: arguments });
		},
		".ptr-content ptr:refresh": function(e) {
			Session.refresh().then(function() {
				f7a.ptr.done(e.target);
				V7.sessionNeeded();
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
	
	function data() {
		var info = Session.info_;
		
		if(!info || info.then) {
			info = { name: "", bedrijf: { naam: "" } };
		}
		
		return {
			User: { name: info.name, company: info.bedrijf.naam },
			anchors: [{
				html: '<li><a href="/veldoffice/meetpunt?key=10970526" class="item-link item-content">\
					<div class="item-media">\
						<i class="fa fa-fw fa-street-view menu-icon bg-color-yellow"></i>\
					</div>\
					<div class="item-inner">\
						<div class="item-title">\
							<div class="item-header">Meetpunt</div>\
							peilbuis 1\
						</div>\
						<div class="item-after">Bewerk</div>\
					</div>\
				</a></li>'
			}, {
				html: '<li><a href="/veldoffice/onderzoek?key=10970526" class="item-content item-link">\
					<div class="item-media">\
						<i class="fa fa-fw fa-street-view menu-icon bg-color-green "></i>\
					</div>\
					<div class="item-inner">\
						<div class="item-title">\
							<div class="item-header"><div class="" style="font-weight:bold;">2e Nieuwstraat 43-47 te Hilversum</div></div>\
							<div class="item-text" style="max-height:none;">\
								<div>\
									<span class="chip methode">NEN 5104</span>\
									<div class="chip LOPEND"><div class="chip-label">In uitvoering</div></div>\
									<div class="chip show-on-map"><div class="chip-label">Kaart</div></div>\
								</div>\
								<div class="item-summary">\
									<span title="27 foto\'s">\
										<i class="fa fa-camera"></i> 27\
									</span>\
									<span title="11 meetpunten" class="">\
										<i class="fa fa-dot-circle-o"></i> 9 / 11\
										<span style="color:silver; font-size:9pt;"> - Hopman en Peters</span>\
									</span>\
								</div>\
							</div>\
						</div>\
					</div>\
				</a></li>'
			}]
		};
	}

	return { template: template, data: data, bindings: bindings };
});