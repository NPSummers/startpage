(function () {
  PokeHome.registerPlugin({
    id: "rss-reader",
    name: "News",
    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5" cy="19" r="1.5" fill="currentColor"/></svg>',

    button: {
      row: 2,
      label: "News",
    },

    popout: {
      title: "News",
      async render(container, ctx) {
        const feedUrl = ctx.storage.get("feedUrl", "");
        if (!feedUrl) {
          container.innerHTML = '<p class="settings-help-text">Set a feed URL in Settings → Plugins → News first.</p>';
          return;
        }
        container.innerHTML = '<p class="settings-help-text">Loading headlines...</p>';
        try {
          const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(feedUrl));
          const data = await res.json();
          if (data.status !== "ok" || !data.items) throw new Error("bad response");

          container.innerHTML = "";
          const list = document.createElement("div");
          list.className = "settings-list";
          list.style.maxHeight = "55vh";
          list.style.overflowY = "auto";
          data.items.slice(0, 25).forEach((item) => {
            const a = document.createElement("a");
            a.className = "settings-list-item";
            a.href = item.link;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            const label = document.createElement("span");
            label.className = "settings-list-label";
            label.textContent = item.title;
            a.appendChild(label);
            list.appendChild(a);
          });
          container.appendChild(list);
        } catch (e) {
          container.innerHTML = '<p class="settings-help-text">Failed to load this feed. Some feeds may not work with the free conversion service.</p>';
        }
      },
    },

    settings: {
      title: "News Settings",
      render(container, ctx) {
        const wrap = document.createElement("div");
        wrap.className = "settings-connection-form";

        const label = document.createElement("label");
        label.className = "settings-field-label";
        label.textContent = "RSS feed URL";
        wrap.appendChild(label);

        const input = document.createElement("input");
        input.type = "url";
        input.className = "settings-text-input";
        input.placeholder = "https://example.com/feed.xml";
        input.value = ctx.storage.get("feedUrl", "");
        input.oninput = () => ctx.storage.set("feedUrl", input.value);
        wrap.appendChild(input);

        const help = document.createElement("p");
        help.className = "settings-help-text";
        help.textContent = "Headlines are fetched via the free api.rss2json.com conversion service.";
        wrap.appendChild(help);

        container.appendChild(wrap);
      },
    },
  });
})();
