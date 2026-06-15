(function () {
  function ensureStyles() {
    if (document.getElementById("launcher-styles")) return;
    const style = document.createElement("style");
    style.id = "launcher-styles";
    style.textContent =
      ".launcher-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; }" +
      ".launcher-item { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; padding: 0.85rem 0.5rem; border-radius: 16px; border: 1px solid rgba(0,0,0,0.08); background: rgba(0,0,0,0.02); cursor: pointer; text-align: center; color: rgb(55, 65, 81); }" +
      "html.dark-mode .launcher-item { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: rgb(226, 232, 240); }" +
      ".launcher-item img { width: 28px; height: 28px; object-fit: contain; }" +
      ".launcher-item span { font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }";
    document.head.appendChild(style);
  }

  StartPage.registerPlugin({
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
          const name = link.name || link.url || "?";
          let iconHtml;
          if (link.icon) {
            iconHtml = '<img src="' + link.icon.replace(/"/g, "&quot;") + '" alt="">';
          } else {
            const initial = name.trim().charAt(0).toUpperCase();
            iconHtml = '<span style="font-size:1.4rem;">' + initial + '</span>';
          }
          item.innerHTML = iconHtml + "<span></span>";
          item.querySelector("span:last-child").textContent = name;
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
            if (link.icon) {
              const icon = document.createElement("img");
              icon.src = link.icon;
              icon.alt = "";
              icon.style.width = "20px";
              icon.style.height = "20px";
              icon.style.objectFit = "contain";
              icon.style.flexShrink = "0";
              item.appendChild(icon);
            }
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

        const iconInput = document.createElement("input");
        iconInput.type = "url";
        iconInput.className = "settings-text-input";
        iconInput.placeholder = "Icon URL (.svg or .png, optional)";
        form.appendChild(iconInput);

        const actions = document.createElement("div");
        actions.className = "settings-connection-actions";
        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "settings-action-btn";
        addBtn.textContent = "Add link";
        addBtn.onclick = () => {
          const name = nameInput.value.trim();
          const url = urlInput.value.trim();
          const icon = iconInput.value.trim();
          if (!name || !url) return;
          const links = getLinks();
          const entry = { name: name, url: url };
          if (icon) entry.icon = icon;
          links.push(entry);
          setLinks(links);
          nameInput.value = "";
          urlInput.value = "";
          iconInput.value = "";
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
