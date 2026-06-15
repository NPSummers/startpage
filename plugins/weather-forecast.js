(function () {
  const WEATHER_CODES = {
    0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Fog",
    51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow",
    80: "Rain showers", 81: "Rain showers", 82: "Violent showers",
    95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
  };

  function describeCode(code) {
    return WEATHER_CODES[code] || "Unknown";
  }

  async function resolveCoords(ctx) {
    const customLocation = ctx.storage.get("location", "");
    const location = customLocation || localStorage.getItem("startpage-location") || "";
    if (!location) return null;
    const res = await fetch("https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + encodeURIComponent(location));
    const data = await res.json();
    const result = data.results && data.results[0];
    if (!result) return null;
    return { lat: result.latitude, lon: result.longitude, name: result.name };
  }

  StartPage.registerPlugin({
    id: "weather-forecast",
    name: "Forecast",
    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.4-1.5A4 4 0 0 0 6 16.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 19v2M8 19v2M16 19v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    button: {
      row: 1,
      label: "Forecast",
    },

    popout: {
      title: "Forecast",
      async render(container, ctx) {
        container.innerHTML = '<p class="settings-help-text">Loading forecast...</p>';
        try {
          const coords = await resolveCoords(ctx);
          if (!coords) {
            container.innerHTML = '<p class="settings-help-text">Set a location on the home screen (Settings) or in this plugin\'s settings.</p>';
            return;
          }
          const unit = localStorage.getItem("startpage-temp-unit") || "fahrenheit";
          const unitSymbol = unit === "celsius" ? "°C" : "°F";
          const res = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=" + coords.lat + "&longitude=" + coords.lon +
            "&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=" + unit + "&timezone=auto"
          );
          const data = await res.json();
          const daily = data.daily;
          container.innerHTML = "";

          const heading = document.createElement("p");
          heading.className = "settings-help-text";
          heading.textContent = "Forecast for " + coords.name;
          container.appendChild(heading);

          const list = document.createElement("div");
          list.className = "settings-list";
          daily.time.forEach((dateStr, i) => {
            const item = document.createElement("div");
            item.className = "settings-list-item";
            const label = document.createElement("span");
            label.className = "settings-list-label";
            const date = new Date(dateStr + "T00:00:00");
            const dayName = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
            label.textContent = dayName + " — " + describeCode(daily.weather_code[i]);
            item.appendChild(label);
            const temps = document.createElement("span");
            temps.className = "settings-status-badge";
            temps.textContent = Math.round(daily.temperature_2m_max[i]) + unitSymbol + " / " + Math.round(daily.temperature_2m_min[i]) + unitSymbol;
            item.appendChild(temps);
            list.appendChild(item);
          });
          container.appendChild(list);
        } catch (e) {
          container.innerHTML = '<p class="settings-help-text">Failed to load forecast.</p>';
        }
      },
    },

    settings: {
      title: "Forecast Settings",
      render(container, ctx) {
        const wrap = document.createElement("div");
        wrap.className = "settings-connection-form";

        const label = document.createElement("label");
        label.className = "settings-field-label";
        label.textContent = "Location override";
        wrap.appendChild(label);

        const input = document.createElement("input");
        input.type = "text";
        input.className = "settings-text-input";
        input.placeholder = "Leave blank to use the home screen location";
        input.value = ctx.storage.get("location", "");
        input.oninput = () => ctx.storage.set("location", input.value);
        wrap.appendChild(input);

        const help = document.createElement("p");
        help.className = "settings-help-text";
        help.textContent = "By default this uses the location set on the home screen. Set a city name here to override it for this plugin.";
        wrap.appendChild(help);

        container.appendChild(wrap);
      },
    },
  });
})();
