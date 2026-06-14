(function () {
  const QUOTES = [
    "The only way to do great work is to love what you do.",
    "Simplicity is the soul of efficiency.",
    "Done is better than perfect.",
    "Small steps every day add up to big results.",
    "Make it work, make it right, make it fast.",
    "Creativity is intelligence having fun.",
    "Your future is created by what you do today, not tomorrow.",
    "Focus on being productive instead of busy.",
    "Progress, not perfection.",
    "Every accomplishment starts with the decision to try.",
  ];

  PokeHome.registerPlugin({
    id: "quote",
    name: "Quote",
    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 7h4v4a4 4 0 0 1-4 4H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 7h4v4a4 4 0 0 1-4 4h-1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    button: {
      row: 1,
      label: "Quote",
    },

    popout: {
      title: "Quote",
      render(container, ctx) {
        const text = document.createElement("p");
        text.className = "settings-help-text";
        text.style.fontSize = "1.05rem";
        text.style.fontStyle = "italic";

        function pick() {
          const index = Math.floor(Math.random() * QUOTES.length);
          text.textContent = "“" + QUOTES[index] + "”";
        }
        pick();
        container.appendChild(text);

        const actions = document.createElement("div");
        actions.className = "settings-connection-actions";
        const newBtn = document.createElement("button");
        newBtn.type = "button";
        newBtn.className = "settings-action-btn";
        newBtn.textContent = "New quote";
        newBtn.onclick = () => {
          pick();
          ctx.playSound();
        };
        actions.appendChild(newBtn);
        container.appendChild(actions);
      },
    },
  });
})();
