(function () {
  PokeHome.registerPlugin({
    id: "ticker",
    name: "Ticker",
    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17l6-6 4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 7h7v7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    button: {
      row: 2,
      label: "Ticker",
    },

    popout: {
      title: "Ticker",
      async render(container, ctx) {
        const idsRaw = ctx.storage.get("coinIds", "bitcoin,ethereum");
        const ids = idsRaw.split(",").map((s) => s.trim()).filter(Boolean);
        if (!ids.length) {
          container.innerHTML = '<p class="settings-help-text">Add coin IDs in Settings → Plugins → Ticker (e.g. bitcoin, ethereum).</p>';
          return;
        }
        container.innerHTML = '<p class="settings-help-text">Loading prices...</p>';
        try {
          const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=" + encodeURIComponent(ids.join(",")) + "&vs_currencies=usd&include_24hr_change=true");
          const data = await res.json();
          container.innerHTML = "";

          const list = document.createElement("div");
          list.className = "settings-list";
          ids.forEach((id) => {
            const entry = data[id];
            const item = document.createElement("div");
            item.className = "settings-list-item";

            const label = document.createElement("span");
            label.className = "settings-list-label";
            label.textContent = id;
            item.appendChild(label);

            const price = document.createElement("span");
            price.className = "settings-status-badge";
            if (entry) {
              const change = entry.usd_24h_change;
              const changeStr = Number.isFinite(change) ? " (" + (change >= 0 ? "+" : "") + change.toFixed(2) + "%)" : "";
              price.textContent = "$" + entry.usd.toLocaleString() + changeStr;
              if (Number.isFinite(change) && change >= 0) price.classList.add("is-connected");
            } else {
              price.textContent = "Not found";
            }
            item.appendChild(price);

            list.appendChild(item);
          });
          container.appendChild(list);

          const refreshActions = document.createElement("div");
          refreshActions.className = "settings-connection-actions";
          const refreshBtn = document.createElement("button");
          refreshBtn.type = "button";
          refreshBtn.className = "settings-action-btn settings-action-btn-secondary";
          refreshBtn.textContent = "Refresh";
          refreshBtn.onclick = () => this.render(container, ctx);
          refreshActions.appendChild(refreshBtn);
          container.appendChild(refreshActions);
        } catch (e) {
          container.innerHTML = '<p class="settings-help-text">Failed to load prices.</p>';
        }
      },
    },

    settings: {
      title: "Ticker Settings",
      render(container, ctx) {
        const wrap = document.createElement("div");
        wrap.className = "settings-connection-form";

        const label = document.createElement("label");
        label.className = "settings-field-label";
        label.textContent = "Coin IDs (comma separated)";
        wrap.appendChild(label);

        const input = document.createElement("input");
        input.type = "text";
        input.className = "settings-text-input";
        input.placeholder = "bitcoin, ethereum, solana";
        input.value = ctx.storage.get("coinIds", "bitcoin,ethereum");
        input.oninput = () => ctx.storage.set("coinIds", input.value);
        wrap.appendChild(input);

        const help = document.createElement("p");
        help.className = "settings-help-text";
        help.textContent = "Use CoinGecko coin IDs (lowercase, e.g. bitcoin, ethereum, dogecoin). Prices are fetched from the free CoinGecko API.";
        wrap.appendChild(help);

        container.appendChild(wrap);
      },
    },
  });
})();
