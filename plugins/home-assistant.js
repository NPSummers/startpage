(function () {
  function apiHeaders(ctx) {
    return {
      Authorization: "Bearer " + ctx.storage.get("token", ""),
      "Content-Type": "application/json",
    };
  }
  function baseUrl(ctx) {
    return (ctx.storage.get("url", "") || "").replace(/\/+$/, "");
  }

  PokeHome.registerPlugin({
    id: "home-assistant",
    name: "Home Assistant",
    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 11l9-8 9 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    button: {
      row: 2,
      label: "Home",
    },

    popout: {
      title: "Home Assistant",
      async render(container, ctx) {
        if (!baseUrl(ctx) || !ctx.storage.get("token", "")) {
          container.innerHTML = '<p class="settings-help-text">Set your Home Assistant URL and long-lived access token in Settings → Plugins → Home Assistant first.</p>';
          return;
        }
        const entitiesRaw = ctx.storage.get("entities", "");
        const entityIds = entitiesRaw.split(",").map((s) => s.trim()).filter(Boolean);
        if (!entityIds.length) {
          container.innerHTML = '<p class="settings-help-text">Add entity IDs (e.g. light.living_room) in this plugin\'s settings.</p>';
          return;
        }

        container.innerHTML = '<p class="settings-help-text">Loading entities...</p>';
        try {
          const list = document.createElement("div");
          list.className = "settings-list";

          for (const entityId of entityIds) {
            const res = await fetch(baseUrl(ctx) + "/api/states/" + encodeURIComponent(entityId), { headers: apiHeaders(ctx) });
            const state = await res.json();

            const item = document.createElement("div");
            item.className = "settings-list-item";

            const label = document.createElement("span");
            label.className = "settings-list-label";
            label.textContent = (state.attributes && state.attributes.friendly_name) || entityId;
            item.appendChild(label);

            const toggle = document.createElement("button");
            toggle.type = "button";
            toggle.setAttribute("role", "switch");
            toggle.className = "settings-switch";
            toggle.setAttribute("aria-checked", state.state === "on" ? "true" : "false");
            toggle.innerHTML = '<span class="settings-switch-thumb"></span>';
            toggle.onclick = async () => {
              const domain = entityId.split(".")[0];
              await fetch(baseUrl(ctx) + "/api/services/" + domain + "/toggle", {
                method: "POST",
                headers: apiHeaders(ctx),
                body: JSON.stringify({ entity_id: entityId }),
              });
              const nowOn = toggle.getAttribute("aria-checked") !== "true";
              toggle.setAttribute("aria-checked", nowOn ? "true" : "false");
            };
            item.appendChild(toggle);

            list.appendChild(item);
          }

          container.innerHTML = "";
          container.appendChild(list);
        } catch (e) {
          container.innerHTML = '<p class="settings-help-text">Failed to connect. Check your URL, token, and that CORS is allowed.</p>';
        }
      },
    },

    settings: {
      title: "Home Assistant Settings",
      render(container, ctx) {
        const wrap = document.createElement("div");
        wrap.className = "settings-connection-form";

        function field(labelText, type, key, placeholder) {
          const label = document.createElement("label");
          label.className = "settings-field-label";
          label.textContent = labelText;
          const input = document.createElement("input");
          input.type = type;
          input.className = "settings-text-input";
          if (placeholder) input.placeholder = placeholder;
          input.value = ctx.storage.get(key, "");
          input.oninput = () => ctx.storage.set(key, input.value);
          wrap.appendChild(label);
          wrap.appendChild(input);
        }

        field("Home Assistant URL", "url", "url", "https://homeassistant.local:8123");
        field("Long-lived access token", "password", "token");
        field("Entity IDs (comma separated)", "text", "entities", "light.living_room, switch.fan");

        const help = document.createElement("p");
        help.className = "settings-help-text";
        help.textContent = "Generate a long-lived access token from your Home Assistant profile page. Your HA instance must allow CORS requests from this page.";
        wrap.appendChild(help);

        container.appendChild(wrap);
      },
    },
  });
})();
