(function () {
  let timer = null;
  let secondsLeft = 0;
  let mode = "work"; // "work" or "break"
  let running = false;

  function getDuration(ctx, key, fallback) {
    const value = parseFloat(ctx.storage.get(key, fallback));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  PokeHome.registerPlugin({
    id: "pomodoro",
    name: "Pomodoro",
    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="13" r="8" stroke="currentColor" stroke-width="2"/><path d="M12 9v4l2.5 2.5M9 3h6M12 3v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    button: {
      row: 1,
      label: "Pomodoro",
    },

    popout: {
      title: "Pomodoro",
      render(container, ctx) {
        if (timer) {
          clearInterval(timer);
          timer = null;
          running = false;
        }

        const display = document.createElement("p");
        display.className = "font-exposure";
        display.style.fontSize = "2.5rem";
        display.style.textAlign = "center";
        display.style.margin = "0.5rem 0";
        container.appendChild(display);

        const status = document.createElement("p");
        status.className = "settings-help-text";
        status.style.textAlign = "center";
        container.appendChild(status);

        const workMins = getDuration(ctx, "workMinutes", 25);
        const breakMins = getDuration(ctx, "breakMinutes", 5);

        if (secondsLeft <= 0) {
          secondsLeft = workMins * 60;
          mode = "work";
        }

        function update() {
          display.textContent = formatTime(secondsLeft);
          status.textContent = mode === "work" ? "Focus time" : "Break time";
        }
        update();

        const actions = document.createElement("div");
        actions.className = "settings-connection-actions";
        const startBtn = document.createElement("button");
        startBtn.type = "button";
        startBtn.className = "settings-action-btn";
        startBtn.textContent = running ? "Pause" : "Start";
        const resetBtn = document.createElement("button");
        resetBtn.type = "button";
        resetBtn.className = "settings-action-btn settings-action-btn-secondary";
        resetBtn.textContent = "Reset";

        function tick() {
          secondsLeft -= 1;
          if (secondsLeft <= 0) {
            mode = mode === "work" ? "break" : "work";
            secondsLeft = (mode === "work" ? workMins : breakMins) * 60;
            ctx.playSound();
          }
          update();
        }

        startBtn.onclick = () => {
          running = !running;
          startBtn.textContent = running ? "Pause" : "Start";
          if (running) {
            timer = setInterval(tick, 1000);
          } else {
            clearInterval(timer);
            timer = null;
          }
        };
        resetBtn.onclick = () => {
          clearInterval(timer);
          timer = null;
          running = false;
          mode = "work";
          secondsLeft = workMins * 60;
          startBtn.textContent = "Start";
          update();
        };

        actions.appendChild(startBtn);
        actions.appendChild(resetBtn);
        container.appendChild(actions);
      },
    },

    settings: {
      title: "Pomodoro Settings",
      render(container, ctx) {
        const wrap = document.createElement("div");
        wrap.className = "settings-connection-form";

        function field(labelText, key, fallback) {
          const label = document.createElement("label");
          label.className = "settings-field-label";
          label.textContent = labelText;
          const input = document.createElement("input");
          input.type = "number";
          input.min = "1";
          input.className = "settings-text-input";
          input.value = ctx.storage.get(key, fallback);
          input.oninput = () => ctx.storage.set(key, input.value);
          wrap.appendChild(label);
          wrap.appendChild(input);
        }

        field("Work duration (minutes)", "workMinutes", 25);
        field("Break duration (minutes)", "breakMinutes", 5);

        container.appendChild(wrap);
      },
    },
  });
})();
