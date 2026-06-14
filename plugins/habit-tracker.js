(function () {
  function todayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }
  function yesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  PokeHome.registerPlugin({
    id: "habit-tracker",
    name: "Habits",
    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>',

    button: {
      row: 2,
      label: "Habits",
    },

    popout: {
      title: "Habits",
      render(container, ctx) {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "settings-text-input";
        input.placeholder = "Add a habit and press Enter...";
        container.appendChild(input);

        const list = document.createElement("div");
        list.className = "settings-list";
        list.style.marginTop = "0.6rem";
        list.style.maxHeight = "50vh";
        list.style.overflowY = "auto";
        container.appendChild(list);

        function getHabits() {
          return ctx.storage.get("habits", []);
        }
        function setHabits(habits) {
          ctx.storage.set("habits", habits);
        }

        function render() {
          const habits = getHabits();
          list.innerHTML = "";
          if (!habits.length) {
            list.innerHTML = '<div class="plugin-list-empty">No habits yet.</div>';
            return;
          }
          habits.forEach((habit, index) => {
            const row = document.createElement("div");
            row.className = "settings-list-item";

            const label = document.createElement("span");
            label.className = "settings-list-label";
            label.textContent = habit.name;
            row.appendChild(label);

            const streak = document.createElement("span");
            streak.className = "settings-status-badge";
            streak.textContent = (habit.streak || 0) + " day" + (habit.streak === 1 ? "" : "s");
            row.appendChild(streak);

            const doneToday = habit.lastDone === todayKey();
            const checkBtn = document.createElement("button");
            checkBtn.type = "button";
            checkBtn.setAttribute("role", "switch");
            checkBtn.className = "settings-switch";
            checkBtn.setAttribute("aria-checked", doneToday ? "true" : "false");
            checkBtn.innerHTML = '<span class="settings-switch-thumb"></span>';
            checkBtn.onclick = () => {
              const current = getHabits();
              const h = current[index];
              if (h.lastDone === todayKey()) {
                h.lastDone = "";
                h.streak = Math.max(0, (h.streak || 0) - 1);
              } else {
                h.streak = h.lastDone === yesterdayKey() ? (h.streak || 0) + 1 : 1;
                h.lastDone = todayKey();
              }
              setHabits(current);
              render();
            };
            row.appendChild(checkBtn);

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "settings-remove-btn";
            removeBtn.setAttribute("aria-label", "Delete habit");
            removeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            removeBtn.onclick = () => {
              const current = getHabits();
              current.splice(index, 1);
              setHabits(current);
              render();
            };
            row.appendChild(removeBtn);

            list.appendChild(row);
          });
        }

        input.onkeydown = (e) => {
          if (e.key !== "Enter") return;
          const name = input.value.trim();
          if (!name) return;
          const habits = getHabits();
          habits.push({ name: name, streak: 0, lastDone: "" });
          setHabits(habits);
          input.value = "";
          render();
        };

        render();
      },
    },
  });
})();
