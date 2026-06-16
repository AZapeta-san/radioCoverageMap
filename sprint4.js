let radioStations = [];
let cities = [];
const markers = [];

fetch("/data/stations_nationwide.csv")
    .then(res => res.text())
    .then(csvText => {
        const parsed = Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: h =>
            h.trim().toLowerCase()
});

        radioStations = parsed.data;

        initMap();
        console.log(parsed.meta);
        console.log(parsed.data[0]);

    });

console.log(radioStations);

const stateColors = {
    'AL':'#e74c3c','AK':'#e67e22','AZ':'#f1c40f','AR':'#2ecc71','CA':'#1abc9c',
    'CO':'#3498db','CT':'#9b59b6','DE':'#e91e63','FL':'#ff5722','GA':'#795548',
    'HI':'#607d8b','ID':'#f44336','IL':'#ff9800','IN':'#ffeb3b','IA':'#8bc34a',
    'KS':'#4caf50','KY':'#009688','LA':'#00bcd4','ME':'#2196f3','MD':'#3f51b5',
    'MA':'#673ab7','MI':'#9c27b0','MN':'#e040fb','MS':'#f06292','MO':'#ff8a65',
    'MT':'#a1887f','NE':'#90a4ae','NV':'#26c6da','NH':'#66bb6a','NJ':'#d4e157',
    'NM':'#ffa726','NY':'#ef5350','NC':'#42a5f5','ND':'#ab47bc','OH':'#26a69a',
    'OK':'#ec407a','OR':'#7e57c2','PA':'#29b6f6','RI':'#9ccc65','SC':'#ffca28',
    'SD':'#8d6e63','TN':'#78909c','TX':'#ff7043','UT':'#26c6da','VT':'#aed581',
    'VA':'#4db6ac','WA':'#64b5f6','WV':'#ce93d8','WI':'#f48fb1','WY':'#bcaaa4',
    'PR':'#80cbc4','DC':'#ffe082'
};

function createColoredIcon(color) {
    return L.divIcon({
        className: '',
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
            <path fill="${color}" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 8.5 12.5 28.5 12.5 28.5S25 21 25 12.5C25 5.596 19.404 0 12.5 0z"/>
            <circle fill="white" cx="12.5" cy="12.5" r="5"/>
        </svg>`,
        iconSize: [25, 41],
        iconAnchor: [12.5, 41],
        popupAnchor: [0, -41]
    });
}

function getMarkerShape(station) {
  const network = (station.network || "klove").toLowerCase();

  if (network.includes("klove") || network.includes("k-love")) {
    return "pin";
}
else if (network.includes("airone")) {
    return "circle";
}
else if (network.includes("bott")) {
    return "square";
}
else if (network.includes("moodyradio")) {
    return "diamond";
}
else if (network.includes("familylife")) {
    return "triangle";
}
else if (network.includes("wayfm")) {
    return "star";
}
else if (network.includes("joyfm")) {
    return "hexagon";
}
else {
    return "pin";
}
}

function createShapeIcon(color, shape) {
  let svgShape = "";

  if (shape === "circle") {
    svgShape = `<circle cx="12.5" cy="12.5" r="10" fill="${color}" />`;
  } else if (shape === "square") {
    svgShape = `<rect x="4" y="4" width="17" height="17" fill="${color}" />`;
  } else if (shape === "diamond") {
    svgShape = `<polygon points="12.5,2 23,12.5 12.5,23 2,12.5" fill="${color}" />`;
  } else if (shape === "triangle") {
    svgShape = `<polygon points="12.5,2 23,23 2,23" fill="${color}" />`;
  } else if (shape === "star") {
    svgShape = `<polygon points="12.5,2 15.5,9 23,9 17,14 19,23 12.5,18 6,23 8,14 2,9 9.5,9" fill="${color}" />`;
  } else if (shape === "hexagon") {
    svgShape = `<polygon points="7,3 18,3 24,12.5 18,22 7,22 1,12.5" fill="${color}" />`;
  } else {
    svgShape = `<path fill="${color}" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 8.5 12.5 28.5 12.5 28.5S25 21 25 12.5C25 5.596 19.404 0 12.5 0z"/>`;
  }

  return L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
      ${svgShape}
      <circle fill="white" cx="12.5" cy="12.5" r="5"/>
    </svg>`,
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
    popupAnchor: [0, -41]
  });
}

function initMap(){

const map = L.map("map").setView([39.8, -98.5], 4);

setTimeout(function() {
    map.invalidateSize();
}, 100);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18
}).addTo(map);

const stationSelect = document.querySelector("#stationSearch");
const citySearch = document.querySelector("#citysearch");
const networkFilter = document.querySelector("#networkFilter");
const cityList = document.querySelector("#cityList");
const networkTagsContainer = document.querySelector("#networkTags");
const stationTagsContainer = document.querySelector("#stationTags");

const activeNetworks = new Set();
const activeStations = new Set();

function addNetworkTag(networkName) {
    if (activeNetworks.has(networkName)) {
        return;
    }

    activeNetworks.add(networkName);

    const tag = document.createElement("div");
    tag.classList.add("network-tag");
    tag.setAttribute("data-network", networkName);

    const label = document.createElement("span");
    label.textContent = networkName;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", function() {
        removeNetworkTag(networkName);
    });

    tag.appendChild(label);
    tag.appendChild(removeBtn);
    networkTagsContainer.appendChild(tag);
}

function removeNetworkTag(networkName) {
    activeNetworks.delete(networkName);

    const tag = networkTagsContainer.querySelector("[data-network='" + networkName + "']");
    if (tag) {
        networkTagsContainer.removeChild(tag);
    }

    networkFilter.value = "";

    filterMarkers();
}


function addStationTag(stationName) {
    if (activeStations.has(stationName)) {
        return;
    }

    activeStations.add(stationName);

    const tag = document.createElement("div");
    tag.classList.add("station-tag");
    tag.setAttribute("data-station", stationName);

    const label = document.createElement("span");
    label.textContent = stationName;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";

    removeBtn.addEventListener("click", function() {
        removeStationTag(stationName);
    });

    tag.appendChild(label);
    tag.appendChild(removeBtn);

    stationTagsContainer.appendChild(tag);

    filterMarkers();
}


function removeStationTag(stationName) {
    activeStations.delete(stationName);

    const tag = stationTagsContainer.querySelector(
        "[data-station='" + stationName + "']"
    );

    if (tag) {
        stationTagsContainer.removeChild(tag);
    }

    filterMarkers();
}






function clearAllNetworkTags() {
    activeNetworks.clear();
    networkTagsContainer.innerHTML = "";
}

function clearAllStationTags() {
    activeStations.clear();
    stationTagsContainer.innerHTML = "";
}

radioStations.forEach(function(station) {
    const color = stateColors[station.state] || '#95a5a6';
    const shape = getMarkerShape(station);
    const marker = L.marker([station.lat, station.lng], { icon: createShapeIcon(color, shape) });

    marker.bindPopup(
        `<strong>${station.network}</strong><br>
        <strong>${station.name}</strong><br>
         Frequency: ${station.frequency}<br>
         City: ${station.city}<br>
         State: ${station.state}`
    );

    marker.on("click", function() {
        map.flyTo([station.lat, station.lng], 7, { animate: true, duration: 1.5 });
    });

    markers.push({
        network: station.network,
        station: station.name,
        state: station.state,
        city: station.city,
        type: station.type,
        marker: marker
    });
});

const cities = [...new Set(radioStations.map(station => station.city))];
cities.forEach(function(city) {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    cityList.appendChild(option);
});

radioStations.forEach(function(station) {
    const option = document.createElement("option");
    option.value = station.name;
    option.textContent = station.name;
    stationSelect.appendChild(option);
});

const networks = [...new Set(radioStations.map(station => station.network))];
networks.forEach(function(network) {
    const option = document.createElement("option");
    option.value = network;
    option.textContent = network;
    networkFilter.appendChild(option);
});

function filterMarkers() {
    const selectedStation = stationSelect.value;
    const selectedCity = citySearch.value;

    markers.forEach(function(item) {
        map.removeLayer(item.marker);

        const hasFilter =
            selectedStation !== "" ||
            selectedCity !== "" ||
            activeNetworks.size > 0 ||
            activeStations.size > 0;

        if (!hasFilter) {
            return;
        }

        const matchStation =
            (selectedStation === "" && activeStations.size === 0) ||
            (selectedStation !== "" && item.station.toLowerCase().includes(selectedStation.toLowerCase())) ||
            (activeStations.size > 0 && activeStations.has(item.station));

        const matchCity =
            selectedCity === "" ||
            item.city.toLowerCase().includes(selectedCity.toLowerCase());

        const matchNetwork =
            activeNetworks.size === 0 ||
            activeNetworks.has(item.network);

        if (matchStation && matchCity && matchNetwork) {
            item.marker.addTo(map);
        }
    });
}

document.querySelector("#reset").addEventListener("click", function() {
    stationSelect.value = "";
    citySearch.value = "";
    networkFilter.value = "";

    clearAllNetworkTags();
    clearAllStationTags();
    filterMarkers();

    stationSuggestions.classList.remove("open");
    citySuggestions.classList.remove("open");

    map.flyTo([39.8, -98.5], 4, { animate: true, duration: 1.5 });
});

const stationInput = document.querySelector("#stationSearch");
const stationSuggestions = document.querySelector("#stationSuggestions");
const citySuggestions = document.querySelector("#citySuggestions");

const allStationNames = [...new Set(radioStations.map(s => s.name))];
const allCityNames = [...new Set(radioStations.map(s => s.city))];

function showSuggestions(inputEl, suggestionsEl, allItems, onSelect) {
    const typed = inputEl.value.toLowerCase().trim();

    suggestionsEl.innerHTML = "";

    if (typed === "") {
        suggestionsEl.classList.remove("open");
        return;
    }

    const matches = allItems.filter(function(item) {
        return item.toLowerCase().includes(typed);
    }).slice(0, 5);

    if (matches.length === 0) {
        suggestionsEl.classList.remove("open");
        return;
    }

    matches.forEach(function(match) {
        const item = document.createElement("div");
        item.textContent = match;
        item.addEventListener("mousedown", function() {
            if (onSelect) {
                onSelect(match);
            } else {
                inputEl.value = match;
            }
            suggestionsEl.classList.remove("open");
            filterMarkers();
        });
        suggestionsEl.appendChild(item);
    });

    suggestionsEl.classList.add("open");
}

stationInput.addEventListener("input", function() {
    showSuggestions(stationInput, stationSuggestions, allStationNames, function(match) {
        addStationTag(match);
        stationInput.value = "";
    });
    filterMarkers();
});

stationInput.addEventListener("blur", function() {
    stationSuggestions.classList.remove("open");
});

citySearch.addEventListener("input", function() {
    showSuggestions(citySearch, citySuggestions, allCityNames);
    filterMarkers();
});

citySearch.addEventListener("blur", function() {
    citySuggestions.classList.remove("open");
});

stationSelect.addEventListener("input", filterMarkers);

networkFilter.addEventListener("change", function() {
    const chosen = networkFilter.value;

    if (chosen === "") {
        return;
    }

    if (chosen === "All") {
        networks.forEach(function(network) {
            addNetworkTag(network);
        });
        networkFilter.value = "";
        filterMarkers();
        return;
    }

    addNetworkTag(chosen);
    networkFilter.value = "";
    filterMarkers();
});

}