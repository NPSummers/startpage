(function () {
  StartPage.registerPlugin({
    id: "clipboard",
    name: "Clipboard",
    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" stroke-width="2"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    button: {
      row: 2,
      label: "Clipboard",
    },

    popout: {
      title: "Clipboard",
      render(container, ctx) {
        const textarea = document.createElement("textarea");
        textarea.className = "settings-text-input";
        textarea.rows = 6;
        textarea.style.resize = "vertical";
        textarea.style.fontFamily = "inherit";
        textarea.placeholder = "Paste or type text to keep on this device...";
        textarea.value = ctx.storage.get("text", "");
        textarea.oninput = () => ctx.storage.set("text", textarea.value);
        container.appendChild(textarea);

        const actions = document.createElement("div");
        actions.className = "settings-connection-actions";

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "settings-action-btn";
        copyBtn.textContent = "Copy to clipboard";
        copyBtn.onclick = async () => {
          try {
            await navigator.clipboard.writeText(textarea.value);
            copyBtn.textContent = "Copied!";
            setTimeout(() => (copyBtn.textContent = "Copy to clipboard"), 1200);
          } catch (e) {
            copyBtn.textContent = "Copy failed";
          }
        };
        actions.appendChild(copyBtn);

        const pasteBtn = document.createElement("button");
        pasteBtn.type = "button";
        pasteBtn.className = "settings-action-btn settings-action-btn-secondary";
        pasteBtn.textContent = "Paste from clipboard";
        pasteBtn.onclick = async () => {
          try {
            const text = await navigator.clipboard.readText();
            textarea.value = text;
            ctx.storage.set("text", text);
          } catch (e) {
            pasteBtn.textContent = "Paste failed";
            setTimeout(() => (pasteBtn.textContent = "Paste from clipboard"), 1200);
          }
        };
        actions.appendChild(pasteBtn);

        container.appendChild(actions);

        const help = document.createElement("p");
        help.className = "settings-help-text";
        help.textContent = "Text is saved on this device only, so you can quickly grab it again later.";
        container.appendChild(help);
      },
    },
  });
})();
