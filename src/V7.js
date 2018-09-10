define(function(require) {
	
	require("leaflet/node_modules/leaflet-rd/src/index");
	
	var Browser = require("util/Browser");
	var Hash = require("util/Hash");
	var Wkt = require("leaflet/plugins/wicket");
	var convexHull = require("node_modules/convexhull-js/convexhull");
	var MeetpuntMarker = require("veldoffice/Meetpunt/leaflet/Marker");
	var PouchDB = require("pouchdb");
	var moment = require("moment");
	var on = require("on");

	var onderzoek_popup_tmpl = require("template7!pages/veldoffice/onderzoek/map-popup-template.html");
	var meetpunt_popup_tmpl = require("template7!pages/veldoffice/meetpunt/map-popup-template.html");

	require("leaflet/plugins/locate");
	
	var v7_objects = new PouchDB("v7-objects");
	var v7_objects_timeouts = {};
	var v7_objects_idx = {};
	var v7_objects_listeners = {};
	
	function calcHash(object) {
		var hash = {};
		for(var k in object) {
			if(k.charAt(0) !== "_" && k.endsWith("_") === false) {
				hash[k] = object[k];
			}
		}
		return Hash.md5(JSON.stringify(hash));
	}
	function v7_objects_create(id, proto) {
		var props = {};
		if(proto) {
			props._proto = {
				writable: false, value: proto,
				enumerable: false
			};
		}

		var r = Object.create(proto || Object.prototype, props);
		r._id = id;
		return (v7_objects_idx[id] = r);
	}
	function v7_objects_emit(id, name, args) {
		return (v7_objects_listeners[id] || []).map(function(listener) {
			if(listener.name === name) {
				return listener.callback.apply(listener, args);
			}
		});
	}

	return {
		locale: {},	
		models: {
			get: function(name) {
				
			}
		},
		
		// Small wrapper around pouch'd objects
		objects: {
			idx: v7_objects_idx, listeners: v7_objects_listeners,
			db: v7_objects,
			get: function(id, proto) {
				// Always returns the same JavaScript object
				if(v7_objects_idx[id] instanceof Promise) {
					return v7_objects_idx[id].$object;
				}
				return v7_objects_idx[id] || this.fetch(id, proto).$object;
			},
			fetch: function(id, proto) {
				// Returns a Promise which will resolve when id is refreshed
				if(v7_objects_idx[id] instanceof Promise) {
					// console.log("V7.objects.fetch", id, "already fetching");
					return v7_objects_idx[id];
				}
				
				var object = v7_objects_idx[id];
				if(object === undefined) {
					// console.log("V7.objects.fetch", id, "created");
					// object = (v7_objects_idx[id] = {_id: id});
					object = v7_objects_create(id, proto);
				}
				var r = (v7_objects_idx[id] = new Promise(function(resolve, reject) {
					v7_objects.get(id, function(err, obj) {
						js.mixIn(object, obj);
						if(v7_objects_idx[id] instanceof Promise) {
							v7_objects_idx[id] = object;
						}
						resolve(object);
						v7_objects_emit(object._id, "fetched", [object]);
						delete r.$object;
					});
				}));
				r.$object = object;
				return r;
			},
			refresh: function(object) {
				if(V7.objects.get(object._id) !== object) {
					throw new Error("Object not managed");
				}
				
				return V7.objects.fetch(object._id);
			},
			// set: function(id, value) {
			// 	if(!value) value = v7_objects_idx[id];
			// 	if(!value._id) value._id = id;
				
			// 	var current_value = v7_objects_idx[id];
			// 	v7_objects_idx[id] = value;
			// 	return v7_objects.put(v7_objects_idx[id], function(err, result) {
			// 		if(err) throw err;
			// 		return result;
			// 	});
			// },
			save: function(object, options) {
				if(typeof object === "string") {
					return V7.objects.save(V7.objects.get(object), options);
				}
				
				if(V7.objects.get(object._id) !== object) {
					throw new Error("Object not managed");
				}
				
				if(options === undefined) options = { delay: 250 };
				
				if(!isNaN(parseInt(options.delay, 10))) {
					return new Promise(function(resolve, reject) {
						if(v7_objects_timeouts[object._id]) {
							clearTimeout(v7_objects_timeouts[object._id]);
						}
						v7_objects_timeouts[object._id] = setTimeout(function() {
							delete v7_objects_timeouts[object._id];
							V7.objects.save(object, { delay: false }).then(function(result) {
								v7_objects_emit(object._id, "saved", [result]);
								resolve(result);
							}).catch(reject);
						}, options.delay);
					});
				}

				var hash = calcHash(object);
				if(object.hash_ !== hash) {
					object.hash_ = hash;
					console.log("V7.objects.save", object._id, object);
					return new Promise(function(resolve, reject) {
						v7_objects.put(object, function(err, result) {
							if(err) reject(err);
							if(result && result.ok === true) {
								object._rev = result.rev;
							}
							resolve(object);
						});
					});
				} else {
					console.log("V7.objects.save", object._id, "hash equals");
				}
				
				return Promise.resolve(object);
			},
			changed: function(object) {
				return object.hash_ !== calcHash(object);
			},
			on: function(object, name, callback) {
				if(typeof object === "string") {
					return V7.objects.on(V7.objects.get(object), name, callback);
				}
				
				if(V7.objects.get(object._id) !== object) {
					throw new Error("Object not managed");
				}
				
				var id = object._id;
				v7_objects_listeners[id] = (v7_objects_listeners[id] || []);
				v7_objects_listeners[id].push({ name: name, callback: callback });
			}
		},
		session: {},
		entities: {
			get: function(entity, key) {
				
			},
			
			query: function(entity, attributes, criteria) {
				
			}
		},
		router: {
			navigate: function() {},
			refresh: function(path) {
				if(!window.f7a) return;
				// Refreshes -path- in all views
				["main", "left"/*, "detail"*/].forEach(function(view) {
					var router = f7a.views[view].router;
					if(router.currentRoute.path === path) {
						router.refreshPage();
					}
				});
			}
		},
		
		util: {
			nextTick: function() {}
		},
		input: {
			takePhoto: function() {
				if(navigator.camera) {
					return navigator.camera.getPicture(function() {}, function() {}, {});
				}
				f7a.dialog.alert(locale("EDeviceNotSupported"), locale("Error"));
			},
			scanCode: function(params, success, failuire) {
				try {
					var Barcode = cordova.require("cordova-plugin-cszbar.zBar");
					
					return Barcode.scan.apply(Barcode, arguments);
				} catch(e) {
					console.error(e);
					f7a.dialog.alert(locale("EDeviceNotSupported"), locale("Error"));
				}
			},
			trackLocation: function() {
				if(f7a.panel.left.opened) {
					f7a.panel.left.close();
				}
				
				$$(".leaflet-control-locate a").click();
			},
		},
		menu: {
			refresh: function() {}
		},
		map$: {
		    initialize: function(map) {
		    	V7.map = map.vars("map");
				V7.markers = map.vars("cluster");
				
				L.control.locate().addTo(V7.map);
	
			  //  function handlePopupEvent(e) {
					// var popup = e.target.up(".leaflet-popup"), value;
					// if(popup) {
					// 	if((value = popup.down("[data-onderzoek]"))) {
					// 		V7.navigate("main", "/veldoffice/onderzoek?key=" + value.dataset.onderzoek);
					// 		e.preventDefault(); /*- very important, major bug in VeldwerkM !!! */
					// 	} else if((value = popup.down("[data-meetpunt]"))) {
					// 		V7.navigate("main", "/veldoffice/meetpunt?key=" + value.dataset.meetpunt);
					// 		e.preventDefault(); /*- very important, major bug in VeldwerkM !!! */
					// 	}
					// }
			  //  }
			  //  on(map._node, {
			  //  	"touchend": function(e) {
					// 	/*- iPhone */
					// 	return handlePopupEvent(e);
			  //  	},
			  //  	"click": function(e) {
					// 	if(Browser.iPhone) return;
					// 	return handlePopupEvent(e.originalEvent || e);
			  //  	}
			  //  });
		    	
	            V7.markers.on({
	                "clusterclick": function() {
	                    // ignoreToggleFullscreenForAWhile();
	                    console.log("markers-clusterclick");
	                },
	                "click": function(e) {
	                	console.log("markers-click", e);
	                	// /*- this instanceof L.MarkerClusterGroup,e.layer instanceof L.Marker */
	                	// var meetpunt = js.mixIn(e.layer.options.meetpunt);
	                	// V7.selected.meetpunt = e.layer.options.meetpunt;
	                	
	                	// meetpunt.onderzoek = onderzoeken.byKey(meetpunt.onderzoek);
	                	// L.popup({ closeButton: false }, e.layer)
	                	// 	.setLatLng(e.layer.getLatLng())
	                	// 	.setContent(Meetpunt_popup_tmpl(meetpunt))
	                	// 	.openOn(V7.map);
	                		
	                	// e.originalEvent.preventDefault();
	                }
	            });
		    },
		    getLeafletMap: function() {
				var map_vcl = document.body.down(".view-main .\\#map")["@vcl"];
				return map_vcl.vars("map");
		    },
		    mapOnderzoek: function(onderzoek) {
				var data = js.get("_views.v7-export", onderzoek);
				return Promise.resolve(data).then(function(data) {
					var meetpunten = Object.keys(data.instances.Meetpunt)
						.map(_ => EM.get("Meetpunt", _))
						.filter(_ => !isNaN(parseFloat(_.xcoord)) && 
							!isNaN(parseFloat(_.ycoord)));
						
					var coords = meetpunten
						.map(_ => ({x: parseFloat(_.xcoord), y: parseFloat(_.ycoord)}));
						
					if(coords.length === 0) {
						f7a.dialog.alert(locale("Onderzoek.nogeodata"), locale("Error"));
						return;
					}
					if(coords.length < 4) {
						var r = 15;
						coords = [
							{x: coords[0].x - r, y: coords[0].y - r}, 
							{x: coords[0].x + r, y: coords[0].y - r},
							{x: coords[0].x + r, y: coords[0].y + r},
							{x: coords[0].x - r, y: coords[0].y + r}
						];
					} else {
						 coords = convexHull(coords);
					}
	
					onderzoek.contour = V7.createContourByRdCoords(onderzoek, coords);					
					onderzoek.contour.addTo(V7.map);
	
					var markers = onderzoek.meetpunt_markers = L.markerClusterGroup({
						// disableClusteringAtZoom: 13,
						// chunkedLoading: true,
						// chunkDelay: 100,
						// chunkProgress: function(processed, total, elapsed, layersArray) {
						// 	var progress = $$('.markers-progress', container)[0];
						// 	var progressBar = $$('.markers-progress-bar', container)[0];
							
						// 	if (elapsed > 100) {
						// 		// if it takes more than a second to load, display the progress bar:
						// 		progress.style.display = 'block';
						// 		progressBar.style.width = Math.round(processed/total*100) + '%';
						// 	}
						// 	if (processed === total) {
						// 		// all markers processed - hide the progress bar:
						// 		progress.style.display = '';
						// 	}
						// }
			        });
					markers.addLayers(meetpunten.map(function(meetpunt) {
		                var pt = {x:meetpunt.xcoord, y:meetpunt.ycoord};
		                var latlng = V7.fromRD(pt); 
		                
		                meetpunt.icon = MeetpuntMarker.icons.byType[(meetpunt.type) || 2377];
		                meetpunt.title = String.format("%s, %s\n%s: %s\n%s: %s", 
		                        meetpunt.code, (meetpunt.type && meetpunt.type.naam) || "meetpunt", 
		                        locale("Meetpunt-datum"), locale("Meetpunt-boormeester"),
		                        moment(meetpunt.datum).format("L"),
		                        meetpunt.boormeester);
		                        
		                meetpunt.marker = MeetpuntMarker.create({}, meetpunt, latlng);
	
		                return meetpunt.marker;
					}));
			        markers.addTo(V7.map);
			        
			        markers.on({
			        	clusterclick: function() { },
			        	click: function(e) {
		                	var meetpunt = js.get("layer.options.meetpunt", e);
	
		                	L.popup({ closeButton: false }, e.layer)
		                		.setLatLng(e.layer.getLatLng())
		                		.setContent(meetpunt_popup_tmpl(meetpunt))
		                		.openOn(V7.map);
		                		
		                	e.originalEvent.preventDefault();
			        	}
			        });
				});
		    },
		    
		    createWktByCoords: function(coords) {
				return String.format("MULTIPOLYGON(((%s))", coords.map(function(coord) {
						return String.format("%s %s", coord.x, coord.y);
					}).join(","));
			},
		    createContourByRdCoords: function(onderzoek, coords) {
		 		return V7.createContourByRdWkt(onderzoek, V7.createWktByCoords(coords));
		    },
		    createContourByRdWkt: function(onderzoek, wkt) {
				/*- 28992 to wgs84 reader, Wkt.Wkt.EPSG28992 */
				var reader = new Wkt.Wkt();
				reader.coordsToLatLng = function(coords, reverse) {
					var latlng = V7.fromRD(coords);
					return Wkt.Wkt.prototype.coordsToLatLng.apply(this, 
						[{x: latlng.lng, y: latlng.lat}, reverse]);
				};
				var contour = reader.read(wkt).toObject();
				contour.bindPopup(onderzoek_popup_tmpl(onderzoek), {closeButton: false});
				contour.onderzoek = onderzoek;
				return contour;
		    },
		    fromRD: function(pt) {
		    	return L.Projection.RD.unproject(pt);
		    },
		    toRD: function(latlng) {
		    	return L.Projection.RD.project(latlng);
		    }
		},
		features: {
			add: function() {
				
			},
			remove: function() {
				
			},
			flyTo: function() {
				
			},
			edit: function() {
				
			}
		},

	//	General Routing
		navigate: function(view, path, opts) {
			var router = f7a.views[view].router;
			if(router.currentRoute.path !== path) {
				router.navigate(path, opts);
			}
			
			if(view === "main" && f7a.panel.left.opened) {
				f7a.panel.left.close();
			}
		},
		refreshPage: function(path) {
			return V7.router.refresh(path);
		},
		refreshMenu: function() {
			return V7.refreshPage("/menu");
		},
	
	//	Util
		nextTick: function(f, ms) {
			setTimeout(f, ms || 0);
		},
		
		sessionNeeded: function() {
			if(Session.isAuthenticated()) { return; }
			
			var autologin = localStorage.getItem("services.veldoffice.autologin");
			if(autologin) {
				var user = localStorage.getItem("services.veldoffice.user");
				var password = localStorage.getItem("services.veldoffice.password");
				
				return Session.login(user, password).then(function() {
					if(!Session.isAuthenticated()) {
						localStorage.removeItem("services.veldoffice.autologin");
						V7.sessionNeeded();
					}
				});
			}

			V7.navigate("left", "/login", {});
		},

	//	Switching Views
		showOnMap: function(type, object) {
			if(f7a.panel.left.opened) {
				f7a.panel.left.close();
			}
			
			function fly(onderzoek) {
	    		setTimeout(function() {
		            V7.map.flyToBounds(onderzoek.contour.getBounds(), {
		            	duration: 1.25, maxZoom: 18
		            });
	            	V7.map.once("zoomend", () => onderzoek.contour.openPopup());
	    		}, 0);
			}
			
			if(type === "Onderzoek") {
				if(object.contour) {
					fly(object);
				} else {
					V7.mapOnderzoek(object).then(function() {
						fly(object);
					});
				}
			} else {
				console.warn("showOnMap", type, object);
			}
		},
	
	//	Advanced Input
		takePhoto: function() {
			if(navigator.camera) {
				return navigator.camera.getPicture(function() {}, function() {}, {});
			}
			f7a.dialog.alert(locale("EDeviceNotSupported"), locale("Error"));
		},
		scanCode: function(params, success, failuire) {
			try {
				var Barcode = cordova.require("cordova-plugin-cszbar.zBar");
				
				return Barcode.scan.apply(Barcode, arguments);
			} catch(e) {
				console.error(e);
				f7a.dialog.alert(locale("EDeviceNotSupported"), locale("Error"));
			}
		},
		trackLocation: function() {
			if(f7a.panel.left.opened) {
				f7a.panel.left.close();
			}
			
			$$(".leaflet-control-locate a").click();
		},
		
	//	Geo
	    createWktByCoords: function(coords) {
			return String.format("MULTIPOLYGON(((%s))", coords.map(function(coord) {
					return String.format("%s %s", coord.x, coord.y);
				}).join(","));
		},
	    createContourByRdCoords: function(onderzoek, coords) {
	 		return V7.createContourByRdWkt(onderzoek, V7.createWktByCoords(coords));
	    },
	    createContourByRdWkt: function(onderzoek, wkt) {
			/*- 28992 to wgs84 reader, Wkt.Wkt.EPSG28992 */
			var reader = new Wkt.Wkt();
			reader.coordsToLatLng = function(coords, reverse) {
				var latlng = V7.fromRD(coords);
				return Wkt.Wkt.prototype.coordsToLatLng.apply(this, 
					[{x: latlng.lng, y: latlng.lat}, reverse]);
			};
			var contour = reader.read(wkt).toObject();
			contour.bindPopup(onderzoek_popup_tmpl(onderzoek), {closeButton: false});
			contour.onderzoek = onderzoek;
			return contour;
	    },
	    fromRD: function(pt) {
	    	return L.Projection.RD.unproject(pt);
	    },
	    toRD: function(latlng) {
	    	return L.Projection.RD.project(latlng);
	    },

	//	Map	    
	    getLeafletMap: function() {
	    	return this.map$.getLeafletMap();
	    },
	    initializeMap: function(map) {
	    	return this.map$.initialize(map);
	    },
	    mapOnderzoek: function(onderzoek) {
	    	return this.map$.mapOnderzoek(onderzoek);
	    }
	};
});

// function camera_stuff() {
	
// 	$("org.cavalion.comp.ui.Label", "photos_menu", {

//                         var MegaPixImage = js.require("stomita.MegaPixImage");
//                         var EXIF = js.require("jseidelin.EXIF");

//                         var scope = this.getScope();
//                         var input = this.getNode().childNodes[1];
//                         var THUMBNAIL_SIZE = 100;
//                         var SRC_SIZE = 1000;

//                         var busy_counter = 0;

//                         this.setVar("input", input);

//                         function newFotoInstance(obj) {
//                             var instance = Manager.newInstance("Foto", js.mixIn(obj, {
//                                 context: scope.instance.getInstance()
//                             }));
//                             scope.instance.hookInstance(instance);
//                             return instance;
//                         }

//                         function getResizedImageDataURL(mpi, type, quality, options) {
//                             var canvas = document.createElement("canvas");
//                             mpi.render(canvas, options);
//                             return canvas.toDataURL(type || "image/jpeg", quality || 0.5);
//                         }

//                         function imageLoaded(evt) {
//                             this.style.height = "";

//                             var w = this.naturalWidth;
//                             var h = this.naturalHeight;
//                             var o = this.$exif.Orientation || 1;

//                             if (h < w) {
//                                 this.parentNode.style.width = "33%";
//                             }

//                             var thumb = getResizedImageDataURL(this.$mpi, "image/png", 1, {
//                                 maxWidth: THUMBNAIL_SIZE,
//                                 maxHeight: THUMBNAIL_SIZE,
//                                 orientation: o
//                             });

//                             var src = getResizedImageDataURL(this.$mpi, "image/jpeg", 0.5, {
//                                 maxWidth: SRC_SIZE,
//                                 maxHeight: SRC_SIZE,
//                                 orientation: o
//                             });

//                             this.$foto = newFotoInstance({
//                                 omschrijving: String.format("%d", this.$n),
//                                 src: src,
//                                 thumb: thumb
//                             });

//                             if (--busy_counter === 0) {
//                                 var busy = scope.commit.getVar("busy");
//                                 scope.commit.removeVar("busy");
//                                 busy.callback();
//                             }
//                         }

//                         input.addEventListener("change", function () {
//                             if (scope.commit.getVar("busy") === undefined) {
//                                 scope.commit.setVar("busy", new Deferred());
//                             }

//                             var host = scope.photos_host.getNode();
//                             var files = this.files;
//                             var l = files.length;
//                             var divs = [];
//                             var i;
//                             var count = host.childNodes.length + 1;

//                             for (i = 0; i < l; i++) {
//                                 var node = document.createElement("div");
//                                 node.innerHTML = String.format("<div class='remove'><div></div></div><img style='height: %dpx;'/><div class='desc'>%d</div>", 75, i + count);
//                                 host.appendChild(node);
//                                 divs.push(node);
//                                 busy_counter++;
//                             }

//                             i = -1;

//                             function next() {
//                                 if (++i < l) {
//                                     var file = files[i];
//                                     var div = divs[i];
//                                     var img = div.childNodes[1];

//                                     img.$n = i + count;
//                                     img.onload = imageLoaded;

//                                     try {
//                                         //EXIF.getData(file, function () {
//                                         try {
//                                             img.$mpi = new MegaPixImage(file);
//                                             img.$exif = file.exifdata || {};
//                                             img.$mpi.render(img, {
//                                                 maxWidth: 300,
//                                                 maxWidth: 300,
//                                                 orientation: img.$exif.Orientation || 1
//                                             });
//                                             next();
//                                         } catch(e) {
//                                             alert(e.message);
//                                         }
//                                         //});
//                                     } catch(e) {
//                                         alert(e.message + 0);
//                                     }
//                                 }
//                             }

//                             //setTimeout(next, 10);
//                             next();
//                         },
//                         false);
//                     },
//                     onTap: function (evt) {
//                         var Manager = js.require("org.cavalion.persistence.Manager");
//                         var scope = this.getScope();

//                         function clear() {
//                             scope.photos_host.getNode().innerHTML = "";

//                             var instances = scope.instance.getInstances();
//                             for (var i = 0; i < instances.length; ++i) {
//                                 var instance = instances[i];
//                                 if (instance.isManaged() === false && instance.getEntity().getQName() === "veldwerkm:Foto") {
//                                     scope.instance.unhookInstance(instance);
//                                 }
//                             }

//                             instances = scope.$owner.getVar("remove");
//                             if (instances === undefined) {
//                                 var gui = scope.$window.getVar("Gui");
//                                 gui.block();

//                                 with(Manager.query("Foto", ".", "where context = ?", [scope.instance.getInstance()])) {
//                                     addCallback(function (res) {
//                                         var objs = res.getObjs();
//                                         var instances = [];
//                                         objs.forEach(function (obj) {
//                                             instances.push(obj);
//                                         });
//                                         scope.$owner.setVar("remove", instances);
//                                         gui.unblock();
//                                     });

//                                     addErrback(function (err) {
//                                         gui.unblock();
//                                         throw err;
//                                     });
//                                 }
//                             }

//                             scope.instance.getInstance().setAttributeValue("modified", new Date());
//                         }

//                         if (js.dom.Element.hasClass(evt.target, "clear")) {
//                             clear();
//                         }
//                     }
//                 }
