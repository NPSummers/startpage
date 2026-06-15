(function () {
  function getFeedUrls(ctx) {
    let urls = ctx.storage.get("feedUrls", null);
    if (!urls) {
      const legacy = ctx.storage.get("feedUrl", "");
      urls = legacy ? [legacy] : [];
      ctx.storage.set("feedUrls", urls);
    }
    return urls;
  }
  function setFeedUrls(ctx, urls) {
    ctx.storage.set("feedUrls", urls);
  }

  StartPage.registerPlugin({
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
        const feedUrls = getFeedUrls(ctx);
        if (!feedUrls.length) {
          container.innerHTML = '<p class="settings-help-text">Add a feed URL in Settings → Plugins → News first.</p>';
          return;
        }
        container.innerHTML = '<p class="settings-help-text">Loading headlines...</p>';
        try {
          const results = await Promise.all(
            feedUrls.map(async (feedUrl) => {
              try {
                const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(feedUrl));
                const data = await res.json();
                if (data.status !== "ok" || !data.items) return [];
                return data.items.map((item) => ({
                  title: item.title,
                  link: item.link,
                  pubDate: item.pubDate,
                  source: (data.feed && data.feed.title) || "",
                }));
              } catch (e) {
                return [];
              }
            })
          );
          const items = results.flat();
          if (!items.length) throw new Error("no items");
          items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

          container.innerHTML = "";
          const list = document.createElement("div");
          list.className = "settings-list";
          list.style.maxHeight = "55vh";
          list.style.overflowY = "auto";
          items.slice(0, 25).forEach((item) => {
            const a = document.createElement("a");
            a.className = "settings-list-item";
            a.href = item.link;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            const label = document.createElement("span");
            label.className = "settings-list-label";
            label.textContent = item.title;
            a.appendChild(label);
            if (item.source) {
              const source = document.createElement("span");
              source.className = "settings-help-text";
              source.style.flexShrink = "0";
              source.textContent = item.source;
              a.appendChild(source);
            }
            list.appendChild(a);
          });
          container.appendChild(list);
        } catch (e) {
          container.innerHTML = '<p class="settings-help-text">Failed to load these feeds. Some feeds may not work with the free conversion service.</p>';
        }
      },
    },

    settings: {
      title: "News Settings",
      render(container, ctx) {
        const list = document.createElement("div");
        list.className = "settings-list";
        container.appendChild(list);

        function render() {
          const feedUrls = getFeedUrls(ctx);
          list.innerHTML = "";
          if (!feedUrls.length) {
            list.innerHTML = '<div class="plugin-list-empty">No feeds added yet.</div>';
            return;
          }
          feedUrls.forEach((url, index) => {
            const item = document.createElement("div");
            item.className = "settings-list-item";
            const label = document.createElement("span");
            label.className = "settings-list-label";
            label.textContent = url;
            item.appendChild(label);
            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "settings-remove-btn";
            removeBtn.setAttribute("aria-label", "Remove feed");
            removeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            removeBtn.onclick = () => {
              const current = getFeedUrls(ctx);
              current.splice(index, 1);
              setFeedUrls(ctx, current);
              render();
            };
            item.appendChild(removeBtn);
            list.appendChild(item);
          });
        }

        const form = document.createElement("div");
        form.className = "settings-connection-form";

        const input = document.createElement("input");
        input.type = "url";
        input.className = "settings-text-input";
        input.placeholder = "https://example.com/feed.xml";
        form.appendChild(input);

        const actions = document.createElement("div");
        actions.className = "settings-connection-actions";
        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "settings-action-btn";
        addBtn.textContent = "Add feed";
        addBtn.onclick = () => {
          const url = input.value.trim();
          if (!url) return;
          const feedUrls = getFeedUrls(ctx);
          feedUrls.push(url);
          setFeedUrls(ctx, feedUrls);
          input.value = "";
          render();
        };
        actions.appendChild(addBtn);
        form.appendChild(actions);

        const help = document.createElement("p");
        help.className = "settings-help-text";
        help.textContent = "Headlines from all feeds are merged and sorted by date. Fetched via the free api.rss2json.com conversion service.";
        form.appendChild(help);

        container.appendChild(form);
        render();
      },
    },
  });
})();
