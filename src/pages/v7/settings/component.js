define(function(require) {
	
	var template = require("template7!./template.html");


	return {
		bindings: {
			".languages .item-content click": function(e) {
				var id = this.id;
				$("li .item-after", this.parentNode).html("");
				$(".item-after", this).html("√");
				$(this).addClass("active-state");
				setTimeout(function() {
					localStorage.setItem("v7.locale", id);
					window.location.reload();
				}, 200);
			}
		},
		template: template
	};
	
});