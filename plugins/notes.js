(function () {
  StartPage.registerPlugin({
    id: "notes",
    name: "Notes",
    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 3v4a1 1 0 0 0 1 1h4M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 13h6M9 17h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    button: {
      row: 1,
      label: "Notes",
    },

    popout: {
      title: "Notes",
      render(container, ctx) {
        const textarea = document.createElement("textarea");
        textarea.className = "settings-text-input";
        textarea.rows = 10;
        textarea.style.resize = "vertical";
        textarea.style.fontFamily = "inherit";
        textarea.placeholder = "Write something...";
        textarea.value = ctx.storage.get("text", "");
        textarea.oninput = () => ctx.storage.set("text", textarea.value);
        container.appendChild(textarea);

        const help = document.createElement("p");
        help.className = "settings-help-text";
        help.textContent = "Saved automatically on this device.";
        container.appendChild(help);
      },
    },
  });
})();
