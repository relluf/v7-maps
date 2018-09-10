define(function(require) {
	
	var tmpl = require("template7!./template.html");
	
	return {
		template: tmpl,
		bindings: {
			".button.rewind click": function(e) {
				V7.session.backToWash();
			},
			".button.reload click": function(e) {
				V7.session.reload();
			},
			".button.logout click": function(e) {
				V7.session.logout();
			}
		}
	};
	
});