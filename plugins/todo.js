(function () {
  function ensureStyles() {
    if (document.getElementById("todo-styles")) return;
    const style = document.createElement("style");
    style.id = "todo-styles";
    style.textContent =
      ".todo-item { gap: 0.6rem; }" +
      ".todo-check { width: 20px; height: 20px; border-radius: 6px; border: 1.5px solid rgba(0,0,0,0.2); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }" +
      ".todo-check.is-done { background: rgb(99, 102, 241); border-color: rgb(99, 102, 241); }" +
      ".todo-check.is-done svg { display: block; }" +
      ".todo-check svg { display: none; width: 14px; height: 14px; color: white; }" +
      ".todo-label.is-done { text-decoration: line-through; opacity: 0.5; }" +
      ".todo-list { max-height: 50vh; overflow-y: auto; }";
    document.head.appendChild(style);
  }

  PokeHome.registerPlugin({
    id: "todo",
    name: "To-Do",
    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    button: {
      row: 1,
      label: "To-Do",
    },

    popout: {
      title: "To-Do",
      render(container, ctx) {
        ensureStyles();

        const input = document.createElement("input");
        input.type = "text";
        input.className = "settings-text-input";
        input.placeholder = "Add a task and press Enter...";
        container.appendChild(input);

        const list = document.createElement("div");
        list.className = "settings-list todo-list";
        list.style.marginTop = "0.6rem";
        container.appendChild(list);

        function getItems() {
          return ctx.storage.get("items", []);
        }
        function setItems(items) {
          ctx.storage.set("items", items);
        }

        function render() {
          const items = getItems();
          list.innerHTML = "";
          if (!items.length) {
            list.innerHTML = '<div class="plugin-list-empty">No tasks yet.</div>';
            return;
          }
          items.forEach((item, index) => {
            const row = document.createElement("div");
            row.className = "settings-list-item todo-item";

            const check = document.createElement("button");
            check.type = "button";
            check.className = "todo-check" + (item.done ? " is-done" : "");
            check.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            check.onclick = () => {
              const current = getItems();
              current[index].done = !current[index].done;
              setItems(current);
              render();
            };
            row.appendChild(check);

            const label = document.createElement("span");
            label.className = "settings-list-label todo-label" + (item.done ? " is-done" : "");
            label.textContent = item.text;
            row.appendChild(label);

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "settings-remove-btn";
            removeBtn.setAttribute("aria-label", "Delete task");
            removeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            removeBtn.onclick = () => {
              const current = getItems();
              current.splice(index, 1);
              setItems(current);
              render();
            };
            row.appendChild(removeBtn);

            list.appendChild(row);
          });
        }

        input.onkeydown = (e) => {
          if (e.key !== "Enter") return;
          const text = input.value.trim();
          if (!text) return;
          const items = getItems();
          items.push({ text: text, done: false });
          setItems(items);
          input.value = "";
          render();
        };

        render();
      },
    },
  });
})();
