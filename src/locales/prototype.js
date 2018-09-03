define(function() { return {
	"Application": {
		".title": "Veldapps",
		".version": "0.1"
	},
	"Model": {
		"":								".",
		".plural":						"Models",
		"-entities":					"Entities",
		"-entities.instances":			"Instances",
		"-entities.favorites":			"Favorites",
		"-entities.all":				"All Entities"
	},
	"Entity": {
		"-attributes":					"Attributes",
		"-instances":					"Instances",
		"-collections":					"Collections",
		"-path":						"Path"
	},
	"Language": {
		".du-NL":						"Nederlands (NL)",
		".du-NL.flag":					"&#x1F1F3;&#x1F1F1",
		".en-US":						"English (US)",
		".en-US.flag":					"&#x1F1FA;&#x1F1F8"
	},
	
	"*.factories/": {
		"key": function() { return this.id; },
		"title": function(entity, factory, options) { return entity; },
		"classes": function() {
			return "hello-world";
		}
	},
	
	"Foto": {
		".factories/": {
			"title": function() {
				return "<img class='Foto-thumb' src='/office-rest/action/images/thumb?id=" + this.id + "'>";
			}
		}
	},
	
	"Veldoffice":									".",
	
	"Onderzoek": {
		".attributes":					"",
		".icon":						"https://cdn0.iconfinder.com/data/icons/industrial-circle/512/hatch_polygon-512.png",
		".factories/": {
			"title": function() {
				var r = []; 
				this.projectcode && r.push(this.projectcode);
				this.naam && r.push(this.naam);
				r = r.join(", ");
				return r;
			},
			"classes": function() {
				var r = [];
				if(this.count_meetpunten_with_coords) {
					r.push("has-meetpunten-with-coords");
				}
				if(this.contour) {
					r.push("has-contour");
				}
				if(this.count_fotos) {
					r.push("has-fotos");
				}
				return r.join(" ");
			}
		}
	},
	"Meetpunt": {
		".icon":						"http://icons.iconarchive.com/icons/pelfusion/long-shadow-media/128/Maps-Pin-Place-icon.png",
		".types":						[2377, 2382, 2387, 2392, 2397, 2402, 2407, 2412, 2417, 2422, 2427, 2432, 2437, 2442, 2447, 2452, 2457, 2462],
		".factories/": {
			"title": function() {
				return String.format("%s, %s", this.code, js.get("type.naam", this));
			}
		}
	}
}});