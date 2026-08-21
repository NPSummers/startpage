i64# Start Page

A simple personal start page with a greeting, local weather, quick links, and a
plugin system for adding your own buttons.

## Running it

```sh
npm start
```

This starts a small static file server (`server.js`) on `http://localhost:6746`
(set `PORT` to use a different port). The server also proxies search-suggestion
requests to `/api/suggest` so the search bar's autocomplete isn't blocked by CORS.

The health check is available at `/health`. Set `HOST` to change the listen
address; it defaults to `0.0.0.0`.

## Kubernetes deployment

The included manifest deploys the app to the `pokehome` namespace and publishes
it through Traefik at `start.aureal.dev`. The app is stateless and does not
need a Secret, database, or persistent volume.

On the Aureal server, after cloning the repository to `/srv/pokehome`:

```sh
cd /srv/pokehome

sudo podman build \
  --no-cache \
  -f Containerfile \
  -t localhost/pokehome:manual \
  .

sudo podman save \
  localhost/pokehome:manual \
  -o /tmp/pokehome.tar

sudo k3s ctr images import /tmp/pokehome.tar
sudo rm -f /tmp/pokehome.tar

sudo k3s kubectl apply -f kubernetes/app.yaml
sudo k3s kubectl rollout status deployment/pokehome -n pokehome
```

Verify the pod and local Traefik route:

```sh
sudo k3s kubectl get deployment,pod,service,endpoints,ingress -n pokehome
curl -fsS -H 'Host: start.aureal.dev' http://127.0.0.1/health
```

Configure the Cloudflare Tunnel public hostname `start.aureal.dev` to use
the service URL `http://127.0.0.1:80`.

## Features

- Greeting, date, and weather (based on a location you set in Settings).
- Background images that change with the time of day.
- A search bar: just start typing anywhere on the page to open it. Use
  Arrow keys / Tab to pick a suggestion, Enter to search, Escape to close.
- **Settings → Appearance**: pick a theme — Dynamic (follows the time of day),
  Light, or Dark.
- **Settings → Search & Links**: choose your search engine (Google, DuckDuckGo,
  Bing, SearXNG, or a custom `%s` URL template), your mail provider, and the
  site the "Ask AI" button opens.
- **Settings → Plugins**: add extra buttons via small JavaScript files hosted
  anywhere (e.g. a GitHub raw URL).
- **Settings → Data & Backup**: export every saved preference and plugin value
  to a JSON file, or restore a backup on another browser or device.

## Writing a plugin

A plugin is a single JavaScript file loaded from a URL you add in
**Settings → Plugins**. When it runs, it should call `StartPage.registerPlugin(...)`
with a plugin definition. Each registered plugin gets a button on the home
screen.

```js
StartPage.registerPlugin({
  id: "my-plugin",          // required, unique string
  name: "My Plugin",         // required, shown as the button label
  icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>' +
        '</svg>',             // required, raw SVG markup (24x24 viewBox recommended)

  // Called when the button is tapped (if no `popout` is defined).
  onClick(ctx) {
    const count = ctx.storage.get("count", 0);
    ctx.storage.set("count", count + 1);
    ctx.navigate("https://example.com");
  },

  // Optional: a custom popout panel (like the Settings modal) that opens
  // when the button is tapped, instead of `onClick`/`url`.
  popout: {
    title: "My Plugin", // optional, defaults to the plugin name
    render(container, ctx) {
      const p = document.createElement("p");
      p.textContent = "Hello from my plugin!";
      container.appendChild(p);

      const closeBtn = document.createElement("button");
      closeBtn.className = "settings-action-btn";
      closeBtn.textContent = "Close";
      closeBtn.onclick = () => ctx.closePopout();
      container.appendChild(closeBtn);
    },
  },

  // Optional: adds a gear icon next to the plugin's entry in
  // Settings → Plugins that opens a settings page.
  settings: {
    title: "My Plugin Settings", // optional, defaults to the plugin name
    render(container, ctx) {
      const input = document.createElement("input");
      input.className = "settings-text-input";
      input.value = ctx.storage.get("greeting", "Hello!");
      input.oninput = () => ctx.storage.set("greeting", input.value);
      container.appendChild(input);
    },
  },
});
```

### Plugin definition

| Field      | Required | Description |
|------------|----------|-------------|
| `id`       | yes      | Unique string identifying the plugin. |
| `name`     | yes      | Default button label and settings page title. |
| `icon`     | yes      | Raw SVG markup string for the default button icon. |
| `onClick`  | no       | `function(ctx)` called when the button is tapped (if no `popout` is set). |
| `url`      | no       | If set (and neither `popout` nor `onClick` is), tapping the button navigates here. |
| `button`   | no       | `{ label?, icon?, size?, row?, render?(btn, ctx), onClick?(ctx) }` — customizes the home screen button. See below. |
| `popout`   | no       | `{ title?, render(container, ctx) }` — opens a custom popout panel (styled like the Settings modal) when the button is tapped. |
| `settings` | no       | `{ title?, render(container, ctx) }` — adds a settings gear icon in Settings → Plugins. `render` is called with an empty container element to fill with your settings UI. |

### The `button` field

By default a plugin gets a button on row 0 (the same row as Ask AI / Mail /
Search) showing its `icon` and `name`. The `button` field lets you customize
this:

- `label` / `icon` — override the text/icon shown on the button.
- `render(btn, ctx)` — fully customize the button's contents; `btn` is an
  empty button element.
- `onClick(ctx)` — overrides the default tap behavior (`popout` → `onClick` →
  `url`) for this button specifically.
- `row` — which row the button appears in (`0` is the top row alongside
  Ask AI / Mail / Search, `1+` are extra rows below). Users can also change a
  plugin's row from Settings → Plugins.
- `size` — relative flex-grow weight for the button's width within its row.

### The `ctx` context object

Passed to `onClick`, `button.render`, `button.onClick`, `popout.render`, and
`settings.render`:

- `ctx.storage.get(key, defaultValue)` / `ctx.storage.set(key, value)` —
  persist plugin data in `localStorage`, namespaced per plugin.
- `ctx.navigate(url)` — navigate the page to a URL.
- `ctx.playSound()` — play the UI's pop sound effect.
- `ctx.closeSettings()` — close the Settings modal.
- `ctx.closePopout()` — close the plugin's popout panel.

### Security

Plugins are loaded as `<script src="...">` tags and run with full access to the
page (DOM, `localStorage`, network). Only add plugins from sources you trust.
