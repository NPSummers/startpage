(function () {
  function ensureStyles() {
    if (document.getElementById("launcher-styles")) return;
    const style = document.createElement("style");
    style.id = "launcher-styles";
    style.textContent =
      ".launcher-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; }" +
      ".launcher-item { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; padding: 0.85rem 0.5rem; border-radius: 16px; border: 1px solid rgba(0,0,0,0.08); background: rgba(0,0,0,0.02); cursor: pointer; text-align: center; }" +
      ".launcher-item span { font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }";
    document.head.appendChild(style);
  }

  PokeHome.registerPlugin({
    id: "quick-launcher",
    name: "Launcher",
    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/></svg>',

    button: {
      row: 1,
      label: "Launcher",
    },

    popout: {
      title: "Launcher",
      render(container, ctx) {
        ensureStyles();
        const links = ctx.storage.get("links", []);
        if (!links.length) {
          container.innerHTML = '<p class="settings-help-text">Add links in Settings → Plugins → Launcher first.</p>';
          return;
        }
        const grid = document.createElement("div");
        grid.className = "launcher-grid";
        links.forEach((link) => {
          const item = document.createElement("button");
          item.type = "button";
          item.className = "launcher-item";
          const initial = (link.name || link.url || "?").trim().charAt(0).toUpperCase();
          item.innerHTML = '<span style="font-size:1.4rem;">' + initial + '</span><span>' + (link.name || link.url) + "</span>";
          item.onclick = () => ctx.navigate(link.url);
          grid.appendChild(item);
        });
        container.appendChild(grid);
      },
    },

    settings: {
      title: "Launcher Settings",
      render(container, ctx) {
        const list = document.createElement("div");
        list.className = "settings-list";
        container.appendChild(list);

        function getLinks() {
          return ctx.storage.get("links", []);
        }
        function setLinks(links) {
          ctx.storage.set("links", links);
        }

        function render() {
          const links = getLinks();
          list.innerHTML = "";
          if (!links.length) {
            list.innerHTML = '<div class="plugin-list-empty">No links added yet.</div>';
            return;
          }
          links.forEach((link, index) => {
            const item = document.createElement("div");
            item.className = "settings-list-item";
            const label = document.createElement("span");
            label.className = "settings-list-label";
            label.textContent = link.name + " — " + link.url;
            item.appendChild(label);
            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "settings-remove-btn";
            removeBtn.setAttribute("aria-label", "Remove link");
            removeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            removeBtn.onclick = () => {
              const current = getLinks();
              current.splice(index, 1);
              setLinks(current);
              render();
            };
            item.appendChild(removeBtn);
            list.appendChild(item);
          });
        }

        const form = document.createElement("div");
        form.className = "settings-connection-form";

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.className = "settings-text-input";
        nameInput.placeholder = "Name (e.g. GitHub)";
        form.appendChild(nameInput);

        const urlInput = document.createElement("input");
        urlInput.type = "url";
        urlInput.className = "settings-text-input";
        urlInput.placeholder = "https://github.com";
        form.appendChild(urlInput);

        const actions = document.createElement("div");
        actions.className = "settings-connection-actions";
        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "settings-action-btn";
        addBtn.textContent = "Add link";
        addBtn.onclick = () => {
          const name = nameInput.value.trim();
          const url = urlInput.value.trim();
          if (!name || !url) return;
          const links = getLinks();
          links.push({ name: name, url: url });
          setLinks(links);
          nameInput.value = "";
          urlInput.value = "";
          render();
        };
        actions.appendChild(addBtn);
        form.appendChild(actions);

        container.appendChild(form);
        render();
      },
    },
  });
})();
