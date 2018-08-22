define([], function() {
	
	function page(path, url) {
		return { path: path, componentUrl: "pages/" + url + ".html" };
	}
	
	return [
		
		page("/map", "map"),
 		page("/login", "login"),
		page("/menu", "menu"),
		page("/session", "session"),
		
		// page("/settings/account", "settings/account"),
		
		page("/investigations", "investigations"),
		
 		page("/test", "tmp/test"),
		// page("/views/{view}", "view")
		
	];
});
