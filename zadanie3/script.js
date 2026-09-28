// ========================================
// 1. WEATHER API
// ========================================

const weatherUrl =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=48.15" +
    "&longitude=17.11" +
    "&current=temperature_2m,wind_speed_10m,relative_humidity_2m" +
    "&hourly=precipitation_probability" +
    "&timezone=auto";

fetch(weatherUrl)
    .then(response => response.json())
    .then(data => {

        const temperature = data.current.temperature_2m;
        const wind = data.current.wind_speed_10m;
        const precipitation = data.hourly.precipitation_probability[0];
        const humidity = data.current.relative_humidity_2m;
        const time = data.current.time;


        document.getElementById("weather").innerHTML =
            "Teplota: " + temperature + " °C<br>" +
            "Vietor: " + wind + " km/h<br>" + 
            "Pravdepodobnosť zrážok: " + precipitation + " %<br>" +
            "Vlhkosť: " + humidity + " %<br>" +
            "Čas: " + time + "<br>"
            
    })
    .catch(error => {

        document.getElementById("weather").innerHTML =
            "Nepodarilo sa načítať počasie.";

        console.error(error);

    });


// ========================================
// 2. LEAFLET MAP
// ========================================

const map = L.map("map").setView(
    [48.151965, 17.072995],
    15
);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
).addTo(map);


// ========================================
// 3. MARKER
// ========================================

L.marker([48.151965, 17.072995])
    .addTo(map)
    .bindPopup("FEI STU Bratislava")
    .openPopup();