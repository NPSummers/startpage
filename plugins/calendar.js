(function () {
  function parseIcs(text) {
    const events = [];
    const blocks = text.split("BEGIN:VEVENT").slice(1);
    blocks.forEach((block) => {
      const summaryMatch = block.match(/SUMMARY:(.*)/);
      const startMatch = block.match(/DTSTART(?:;[^:]*)?:(\d{8}(?:T\d{6})?)/);
      if (!summaryMatch || !startMatch) return;
      const raw = startMatch[1];
      let date;
      if (raw.length === 8) {
        date = new Date(raw.slice(0, 4) + "-" + raw.slice(4, 6) + "-" + raw.slice(6, 8) + "T00:00:00");
      } else {
        date = new Date(
          raw.slice(0, 4) + "-" + raw.slice(4, 6) + "-" + raw.slice(6, 8) + "T" +
          raw.slice(9, 11) + ":" + raw.slice(11, 13) + ":" + raw.slice(13, 15)
        );
      }
      events.push({ title: summaryMatch[1].trim(), date: date });
    });
    return events;
  }

  StartPage.registerPlugin({
    id: "calendar",
    name: "Agenda",
    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',

    button: {
      row: 2,
      label: "Agenda",
    },

    popout: {
      title: "Agenda",
      async render(container, ctx) {
        const icsUrl = ctx.storage.get("icsUrl", "");
        if (!icsUrl) {
          container.innerHTML = '<p class="settings-help-text">Set a calendar (.ics) URL in Settings → Plugins → Agenda first.</p>';
          return;
        }
        container.innerHTML = '<p class="settings-help-text">Loading events...</p>';
        try {
          const res = await fetch(icsUrl);
          const text = await res.text();
          const now = new Date();
          const events = parseIcs(text)
            .filter((e) => e.date >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
            .sort((a, b) => a.date - b.date)
            .slice(0, 20);

          container.innerHTML = "";
          if (!events.length) {
            container.innerHTML = '<div class="plugin-list-empty">No upcoming events.</div>';
            return;
          }
          const list = document.createElement("div");
          list.className = "settings-list";
          list.style.maxHeight = "55vh";
          list.style.overflowY = "auto";
          events.forEach((event) => {
            const item = document.createElement("div");
            item.className = "settings-list-item";
            const label = document.createElement("span");
            label.className = "settings-list-label";
            label.textContent = event.title;
            item.appendChild(label);
            const when = document.createElement("span");
            when.className = "settings-status-badge";
            when.textContent = event.date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
            item.appendChild(when);
            list.appendChild(item);
          });
          container.appendChild(list);
        } catch (e) {
          container.innerHTML = '<p class="settings-help-text">Failed to load this calendar. The URL must be reachable and allow CORS.</p>';
        }
      },
    },

    settings: {
      title: "Agenda Settings",
      render(container, ctx) {
        const wrap = document.createElement("div");
        wrap.className = "settings-connection-form";

        const label = document.createElement("label");
        label.className = "settings-field-label";
        label.textContent = "Calendar (.ics) URL";
        wrap.appendChild(label);

        const input = document.createElement("input");
        input.type = "url";
        input.className = "settings-text-input";
        input.placeholder = "https://example.com/calendar.ics";
        input.value = ctx.storage.get("icsUrl", "");
        input.oninput = () => ctx.storage.set("icsUrl", input.value);
        wrap.appendChild(input);

        const help = document.createElement("p");
        help.className = "settings-help-text";
        help.textContent = "Use a public/secret iCal feed URL (e.g. from Google Calendar's 'Secret address in iCal format').";
        wrap.appendChild(help);

        container.appendChild(wrap);
      },
    },
  });
})();
