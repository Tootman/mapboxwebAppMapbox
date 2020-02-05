"use strict";
import firebase from "firebase/app";
import "firebase/storage";
import "firebase/database";
import { User } from "./User.js";
import $ from "jquery";
import "bootstrap";
import "./main.scss";
import bbox from "@turf/bbox";
import mapboxgl from "mapbox-gl";

const state = {};
state.settings = {};
state.about = {};
state.about.version = "0.9.041";
state.about.releaseDate = "3rd February 2020";
state.about.content = `<h4> ORCL Client map</h4><p> Occam's Razor Consulting Ltd, parks and open spaces Asset map</p>
<p> Displaying: <div id="map-name"></div></p>
<h4> App details </h4>
<p>Version: ${state.about.version}</p> <p>Released: ${
  state.about.releaseDate
}</p><p>Website © Occam's Razor Consulting Ltd 2019 <br>Contains Ordnance Survey data © Crown copyright and database right 2013
</p>`;
state.sitesFeatureCollection = {};
state.sitesQueryResult = {};
state.fbDatabase = {};
state.userProfile = {};
state.projectConfig = {};

const loadSiteNamesDatasetLayer = datasetId => {
  const url = `https://api.mapbox.com/datasets/v1/dansimmons/${datasetId}/features?access_token=${
    mapboxgl.accessToken
  }`;
  fetch(url)
    .then(resp => resp.json()) // Transform the data into json
    .then(function(data) {
      state.sitesFeatureCollection = data;
      const siteNames = data.features.map(feature => {
        const siteName =
          feature.properties.Site_Name || feature.properties.Site;
        return siteName;
      });
      autocomplete(document.getElementById("myInput"), siteNames);
    });
};

const armIsStyleLoaded = () => {
  if (map.isStyleLoaded()) {
    // map.off("data", armIsStyleLoaded);
    //console.log("finally loaded");
    document.getElementById("loader-spinner-container").style.display = "none";
    //const mapID = state.settings.currentMapId;
    // note that below takes settings from UserProfile NOT from local settings
    // it is assumed that local settings center and zoom will be removed soon
    //map.setCenter(state.userProfile.center);
    //map.setZoom(state.userProfile.zoom);
    //map.setZoom(11);
    console.log("Style now loaded");
  } else {
    document.getElementById("loader-spinner-container").style.display =
      "inline";
  }
  // console.log("armIsStyleLoaded called!");
};

const selectNewMap = mapID => {
  map.setStyle(state.userProfile.mapboxStyleId);
  //document.querySelector("#satellite-layer-chkbox").checked = false;
  //state.settings.currentMapId = mapID; // fudge - come back to
  map.on("data", armIsStyleLoaded);

  document.getElementById("navbarToggler").classList.remove("show");
  //loadSiteNamesDatasetLayer(state.settings.maps[mapID].sitesDataSet);
  loadSiteNamesDatasetLayer(state.userProfile.mapboxSitesDataSet);
};

const addSelectableMapboxLayersToNav = userProfileOb => {
  const htmlFromStr = domstring => {
    // quick hack to inject some html - come back to ...
    const html = new DOMParser().parseFromString(domstring, "text/html");
    return html.body.firstChild;
  };
  console.log("profile:", userProfileOb);
  if (userProfileOb.selectableMapboxLayers) {
    userProfileOb.selectableMapboxLayers.map(item => {
      // add checkbox etc to dropdown menu
      const optionMenu = document.getElementById("options-dropdown");

      /*
      optionMenu.append(
        htmlFromStr(
          `<div class="form-check" id="vegetation-layer-chkbox-container">
            <input type="checkbox" class="form-check-input" name="vegetation-layer-chkbox" id="vegetation-layer-chkbox"/>
            <label class="form-check-label" for="vegetation-layer-chkbox">Show vegetation </label>
          </div>`
        )
      );
      */

      state.userProfile.optionalLayers.map((item, index) => {
        optionMenu.append(
          htmlFromStr(
            `<div class="form-check" id="option${index}-chkbox-container">
                <input type="checkbox" class="form-check-input" name="${
                  item.layerName
                }" id="option${index}-chkbox"/>
                <label class="form-check-label" for="option${index}-chkbox">${
              item.label
            } </label>
              </div>`
          )
        );
        document
          .querySelector(`#option${index}-chkbox`)
          .addEventListener("change", e => {
            //console.log("clicked!:", e.target.checked);
            if (e.target.checked) {
              map.setLayoutProperty(e.target.name, "visibility", "visible");
            } else {
              map.setLayoutProperty(e.target.name, "visibility", "none");
            }
          });
      });
    });

    /*
    document
      .querySelector("#vegetation-layer-chkbox")
      .addEventListener("change", e => {
        //console.log("clicked!:", e.target.checked);
        if (e.target.checked) {
          map.setLayoutProperty("veglayer", "visibility", "visible");
        } else {
          map.setLayoutProperty("veglayer", "visibility", "none");
        }
      });
      */
  }
};

const selectNewMapWithAccess = userProfile => {
  mapboxgl.accessToken = userProfile.mapboxAccessToken;
  map.setStyle(userProfile.mapboxStyleId);
  map.setCenter(state.userProfile.center);
  map.setZoom(state.userProfile.zoom);

  //document.querySelector("#satellite-layer-chkbox").checked = false;
  //state.settings.currentMapId = mapID; // fudge - come back to
  map.on("data", armIsStyleLoaded);
  //document.getElementById("navbarToggler").classList.remove("show");
  loadSiteNamesDatasetLayer(userProfile.mapboxSitesDataSet);
  attachMapListeners();
};

// ------ init -------------------------------

document.addEventListener("DOMContentLoaded", function(event) {
  initApp();

  document.getElementById("login-btn").addEventListener("click", () => {
    //User().btnLogin();
    console.log("btnlogin");
    userLogin();
  });
  document.getElementById("logout-btn").addEventListener("click", () => {
    userLogout();
  });
});

const initApp = () => {
  console.log("initApp!");
  state.fbDatabase = initFirebase();
  const myUser = User();

  const loggedIn = myUid => {
    // logged in Func
    getUserProfileFromFirebase(myUid).then(snapshot => {
      state.userProfile = snapshot.val();
      document.getElementById("Login-status-message").innerHTML = `Hi ${
        state.userProfile.userName
      }`;
      document.getElementById("login-btn").style.display = "none";
      document.getElementById("logout-btn").style.display = "block";
      document.getElementById("login-form").style.display = "none";
      document.querySelector("canvas").style.display = "block";
      $("#modal-login-form").modal("hide");
      document.getElementById("loader-spinner-container").style.display =
        "none";

      document
        .querySelector(".mapboxgl-ctrl-zoom-in")
        .setAttribute("title", "Zoom In");
      document
        .querySelector(".mapboxgl-ctrl-zoom-out")
        .setAttribute("title", "Zoom Out");
      document
        .querySelector(".mapboxgl-ctrl-geolocate")
        .setAttribute("title", "GPS location");
      selectNewMapWithAccess(state.userProfile);
      addSelectableMapboxLayersToNav(state.userProfile);
      retrieveProjectConfig(state.userProfile);
    });
  };

  const loggedOut = () => {
    //logged out func
    document.getElementById("Login-status-message").innerHTML =
      "Bye - you have now signed out";
    document.getElementById("login-btn").style.display = "block";
    document.getElementById("logout-btn").style.display = "none";
    document.getElementById("login-form").style.display = "block";
    document.querySelector("canvas").style.display = "none";
    document.getElementById("loader-spinner-container").style.display = "none";
    console.log("logged out - callback");
    removeSelectableLayers();
  };

  myUser.OnAuthChangedListener(loggedIn, loggedOut);
};

const attachMapListeners = () => {
  document
    .getElementById("about-infobox-link")
    .addEventListener("click", () => {
      showAboutBox();
    });

  map.on("moveend", function(e) {
    document.getElementById("myInput").value = "";
  });

  document;
  /*
    .querySelector("#satellite-layer-chkbox")
    .addEventListener("change", e => {
      if (e.target.checked) {
        // Checkbox is checked..
        satImageSetVisible(true);
        console.log("tickbox checked");
      } else {
        // Checkbox is not checked..
        satImageSetVisible(false);
        console.log("tickbox notChecked");
      }
    });
*/
  console.log("mapOnClick listener attached");
  map.on("click", e => {
    const features = map.queryRenderedFeatures(e.point, {
      //layers: state.userProfile.clickableLayers
      layers: state.userProfile.clickableLayers
    });
    if (!features.length) {
      return;
    }
    const feature = features[0];

    document.querySelector(".modal-related-image").style = "display:none"; // clear photo
    if (state.userProfile.hasRelatedData) {
      let obType = feature.geometry.type; // need to refactor to func
      if (feature.geometry.type == "MultiPolygon") {
        obType = "Polygon";
      }
      const obId = feature.properties.OBJECTID + obType;
      fetchLastFirebaseRelatedData(obId);
    }
    const p = feature.properties;
    const popupTitle = p.ASSET || p.Asset || p.asset;
    //const popupFeatureContent = propSet(feature)
    //document.getElementById("popup-feature-template").innerHTML = propSet(feature)
    const modalContent = `${propSet(
      feature.properties
    )}</p><div class="propsetPhoto"></div>`;
    const popupContent = `<dt>${popupTitle}</dt><button type="button" class="btn btn-primary" data-toggle="modal" data-target="#asset-infobox">
        more...</button>`;
    //const popupContent = `<img id="related-image" src="example-photo.jpg"/>`
    document.querySelector(".modal-feature-attr").innerHTML = modalContent;
    document.querySelector("#asset-infobox-title").innerHTML = popupTitle;
    const popup = new mapboxgl.Popup({
      offset: [0, -15]
    })
      .setLngLat(e.lngLat)
      .setHTML(popupContent)
      .addTo(map);
    //attachPropsetPhotoIfExists(feature.properties);
    const photoParentEl = document.querySelector(".modal-feature-photo");
    photoParentEl.src = "";
    if ((p.Photo || p.PHOTO) && state.userProfile.fbStoragePhotosPath) {
      //const storage = firebase.storage();
      //const pathRef = storage.ref(state.userProfile.fbStoragePhotosPath);
      const pathRef = state.userProfile.fbStoragePhotosPath;
      // .modal-feature-photo
      const photoId = p.Photo || p.PHOTO;
      fetchPhotoFromFBStorage({
        parentEl: photoParentEl,
        path: state.userProfile.fbStoragePhotosPath,
        photoId: photoId
      });
    } //else {
    //  photoParentEl.src = "";
    //  }
  });
};

const attachPropsetPhotoIfExists = propset => {
  let el = "";
  if (propset.Photo || propset.PHOTO) {
    el = `<P>Photo here!</p>`;
  }
  return el;
};
const map = new mapboxgl.Map({
  container: "map",
  center: {
    lat: 51.443858500160644,
    lng: -0.3215425160765335
  },
  zoom: 11,
  maxZoom: 24,
  minZoom: 10,
  sprite: "mapbox://sprites/mapbox/bright-v8" //
});

map.addControl(
  new mapboxgl.NavigationControl({
    showCompass: false
  })
);
map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true,
    fitBoundsOptions: {
      zoom: 19
    }
  })
);
map.addControl(
  new mapboxgl.ScaleControl({
    maxWidth: 80,
    unit: "metric"
  })
);

map.on("load", e => {
  state.userProfile.clickableLayers.map(layer => {
    map.on("mouseenter", layer, e => {
      map.getCanvas().style.cursor = "default";
    });
    map.on("mouseleave", layer, () => {
      map.getCanvas().style.cursor = "";
    });
  });

  //console.log("mapresources loaded");
});

// ------------- functions ---

const searchBoxOnFocus = () => {
  // Function not  used since  full dataset now stored in state
  // todo: why not all orignal shp properties appearing in object todo!!??
  console.log("focus!");
  alert("focus");
  const mapId = state.settings.currentMapId;
  //const siteNames = siteNamesArr('richmondsitenames-EPSG-4326-23yist')
  state.sitesQueryResult = map.querySourceFeatures("composite", {
    sourceLayer: state.userProfile.mapboxDataSource
    // ,filter: ['==', 'Site_Name', 'Grove Road Gardens']
  });
  const siteNames = state.sitesQueryResult.map(feature => {
    const siteName = feature.properties.Site_Name || feature.properties.Site;
    console.log("inside sitename:", siteName);
    return siteName;
  });
  autocomplete(document.getElementById("myInput"), siteNames);
};

const siteNamesArr = sourceLayer => {
  const sites = map.querySourceFeatures("composite", {
    sourceLayer: sourceLayer
    // ,filter: ['==', 'Site_Name', 'Grove Road Gardens']
  });
  const sitesSet = new Set(
    sites.map(site => {
      return site.properties.Site_Name;
    })
  );
  return Array.from(sitesSet).sort();
};

const flyTo = siteName => {
  // queryAllFeatures
  //console.log("siteName:", siteName);
  const siteId = state.settings.currentMapId;
  console.log("state:", state);
  /*
        const sites = map.querySourceFeatures('composite', {
          'sourceLayer': state.settings.maps[siteId].dataSource
          // ,filter: ['==', 'Site_Name', 'Grove Road Gardens']
        })
    */
  // return match where properties.Site_Name = Site_Name
  const site = state.sitesFeatureCollection.features.filter(site => {
    const prop_name = site.properties.Site_Name || site.properties.Site;
    return prop_name == siteName;
  });
  //console.log("site:", site);
  map.fitBounds(bbox(site[0])); // fails with array
  //turf.bbox()
  //document.getElementById('myInput').value=""
};

const showAboutBox = () => {
  const el = document.getElementById("about-infobox-content");
  el.innerHTML = state.about.content;
  document.getElementById("map-name").innerHTML =
    state.userProfile.mapboxMapName;
};

const reseToBoundsOfProject = () => {
  const mapId = state.settings.currentMapId;
  map.setCenter(state.userProfile.center);
  map.setZoom(state.userProfile.zoom);
};

const fetchLastFirebaseRelatedData = obId => {
  const path = `/App/Maps/${
    state.userProfile.parentRelDataMapHash
  }/Related/${obId}`;
  console.log("path:", path);
  state.fbDatabase
    .ref(path)
    .orderByKey()
    .limitToLast(1)
    .once("value")
    .then(snap => {
      try {
        // attept to read related data child note from firebase
        const mySnap = snap.val();
        const propObject = mySnap[Object.keys(mySnap)[0]];
        if (propObject) {
          let relatedDataContent = `<h4>Latest update</h4>`;
          relatedDataContent += propSet(propObject);
          document.querySelector(
            ".modal-related-data"
          ).innerHTML = relatedDataContent;
        }

        if (propObject.photo) {
          try {
            fetchPhotoFromFBStorage({
              parentEl: document.querySelector(".modal-related-image"),
              path: "hounslow/300x400/",
              photoId: propObject.photo
            });
            document.querySelector(".modal-related-image").style =
              "display:block";
          } catch {
            console.log("failed to load rel data photos");
          }
        }
      } catch (error) {
        console.log("relatedData failed");
        document.querySelector(".modal-related-data").innerHTML = "";
      }
    });
};

const fetchPhotoFromFBStorage = ({ parentEl, path, photoId }) => {
  const storage = firebase.storage();
  const pathRef = storage.ref(path);
  pathRef
    .child(photoId)
    .getDownloadURL()
    .then(url => {
      fetch(url)
        .then(response => {
          return response.blob();
        })
        .then(imageBlob => {
          parentEl.src = URL.createObjectURL(imageBlob);
          parentEl.style.width = "100%";
        })
        .catch(error => {
          //alert ("Error!:", error.message)
        });
    });
};

const propSet = p => {
  const itemList = Object.keys(p)
    .map(item => {
      if (item == "condition") {
        p[item] = state.projectConfig.schema.formFields.condition[p[item]];
      }
      return `<tr><td>${item}</td><td>${p[item]}</td>`;
    })
    .join("</tr>");
  return `<table class="table table-sm table-striped">${itemList}</table>`;
};

const fireBaseconfig = {
  apiKey: "AIzaSyB977vJdWTGA-JJ03xotQkeu8X4_Ds_BLQ",
  authDomain: "fir-realtime-db-24299.firebaseapp.com",
  databaseURL: "https://fir-realtime-db-24299.firebaseio.com",
  projectId: "fir-realtime-db-24299",
  storageBucket: "fir-realtime-db-24299.appspot.com",
  messagingSenderId: "546067641349"
};

const initFirebase = () => {
  firebase.initializeApp(fireBaseconfig);
  return firebase.database();
};

const userLogin = () => {
  User()
    .btnLogin()
    .then(data => {
      console.log("login () any final stuff:", data);
    })
    .catch(error => {
      console.log("error in login!");
    });
};

const userLogout = data => {
  User().btnLogout();
};

const retrieveProjectConfig = userProfile => {
  console.log("retrieved project info from Fb:", userProfile);
  if (userProfile.projectId == null) {
    console.log("no projectConfig (projectId) found");
    return;
  }
  return firebase
    .database()
    .ref(`App/Projects/${userProfile.projectId}/`)
    .once("value")
    .then(result => {
      state.projectConfig = result.val();
      console.log("returned projectConfig:", state.projectConfig);
    });
};

const getUserProfileFromFirebase = userId => {
  return firebase
    .database()
    .ref(`App/Users/${userId}/`)
    .once("value");
};

/*
const satImageSetVisible = visible => {
  if (visible) {
    map.setLayoutProperty("mapbox-satellite", "visibility", "visible");
    //map.setPaintProperty('polygons', 'fill-opacity', 0.1);
  } else {
    map.setLayoutProperty("mapbox-satellite", "visibility", "none");
  }
};
*/

// --- search auto complete ---

function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
  //console.log("autocomplete!!!", inp, arr);
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function(e) {
    var a,
      b,
      i,
      val = this.value;
    /*close any already open lists of autocompleted values*/
    closeAllLists();
    if (!val) {
      return false;
    }
    currentFocus = -1;
    /*create a DIV element that will contain the items (values):*/
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    /*append the DIV element as a child of the autocomplete container:*/
    this.parentNode.appendChild(a);
    /*for each item in the array...*/
    for (i = 0; i < arr.length; i++) {
      /*check if the item starts with the same letters as the text field value:*/
      if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
        /*create a DIV element for each matching element:*/
        b = document.createElement("DIV");
        /*make the matching letters bold:*/
        b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
        b.innerHTML += arr[i].substr(val.length);
        /*insert a input field that will hold the current array item's value:*/
        b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
        /*execute a function when someone clicks on the item value (DIV element):*/
        b.addEventListener("click", function(e) {
          /*insert the value for the autocomplete text field:*/
          inp.value = this.getElementsByTagName("input")[0].value;

          /*close the list of autocompleted values,
            (or any other open lists of autocompleted values:*/
          closeAllLists();
          flyTo(inp.value);
          document
            .getElementById("navbarToggler")
            .classList.replace("show", "hide");
        });
        a.appendChild(b);
      }
    }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function(e) {
    var x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode == 40) {
      /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
      currentFocus++;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 38) {
      //up
      /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
      currentFocus--;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 13) {
      /*If the ENTER key is pressed, prevent the form from being submitted,*/
      e.preventDefault();
      if (currentFocus > -1) {
        /*and simulate a click on the "active" item:*/
        if (x) x[currentFocus].click();
      }
    }
  });

  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = x.length - 1;
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }

  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }

  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
      except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function(e) {
    closeAllLists(e.target);
  });
}

const removeSelectableLayers = layerList => {
  // remove navmenu chkbox etc if it exists
  const el = document.querySelector("#vegetation-layer-chkbox-container");
  if (el) {
    el.parentNode.removeChild(el);
  }
};
