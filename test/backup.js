const assert = require("assert/strict");
const fs = require("fs");
const vm = require("vm");

const html = fs.readFileSync("index.html", "utf8");
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, "Could not find the application script in index.html");
new vm.Script(scriptMatch[1]);
const match = html.match(/\/\/ Data export and import([\s\S]*?)\/\/ Sound effects/);
assert.ok(match, "Could not find the backup implementation in index.html");
const backupSource = match[0].replace(/\/\/ Sound effects[\s\S]*$/, "");

function createStorage(seed = {}) {
  const storage = { ...seed };
  Object.defineProperties(storage, {
    getItem: {
      value(key) {
        return Object.prototype.hasOwnProperty.call(this, key) ? this[key] : null;
      },
    },
    setItem: {
      value(key, value) {
        this[key] = String(value);
      },
    },
    clear: {
      value() {
        Object.keys(this).forEach((key) => delete this[key]);
      },
    },
  });
  return storage;
}

function createContext(seed = {}) {
  const status = {
    textContent: "",
    classList: {
      toggle(_name, enabled) {
        status.isError = enabled;
      },
    },
  };
  const context = {
    Blob: class BlobMock {
      constructor(parts, options) {
        this.parts = parts;
        this.options = options;
        context.lastBlob = this;
      }
    },
    URL: {
      createObjectURL: () => "blob:test",
      revokeObjectURL: () => {},
    },
    console: { error: () => {} },
    document: {
      body: { appendChild: () => {} },
      createElement: () => ({ click: () => {}, remove: () => {} }),
      getElementById: (id) => (id === "data-backup-status" ? status : null),
    },
    localStorage: createStorage(seed),
    playPopSound: () => {},
  };
  context.window = {
    confirm: () => true,
    location: {
      origin: "https://start.aureal.dev",
      reload: () => {
        context.reloaded = true;
      },
    },
    setTimeout: (callback) => callback(),
  };
  vm.runInNewContext(backupSource, context);
  return { context, status };
}

async function run() {
  const exported = createContext({
    "startpage-theme-mode": "dark",
    "startpage-plugin-data-notes-items": "[\"remember me\"]",
  });
  exported.context.exportStartPageData();
  const backup = JSON.parse(exported.context.lastBlob.parts.join(""));
  assert.equal(backup.format, "startpage-backup");
  assert.equal(backup.version, 1);
  assert.equal(backup.origin, "https://start.aureal.dev");
  assert.deepEqual(JSON.parse(JSON.stringify(backup.data.localStorage)), {
    "startpage-plugin-data-notes-items": "[\"remember me\"]",
    "startpage-theme-mode": "dark",
  });
  assert.match(exported.status.textContent, /Exported 2 saved items/);

  const imported = createContext({ "startpage-theme-mode": "light", obsolete: "remove-me" });
  const input = {
    files: [{
      text: async () => JSON.stringify({
        format: "startpage-backup",
        version: 1,
        data: { localStorage: backup.data.localStorage },
      }),
    }],
    value: "selected.json",
  };
  await imported.context.importStartPageData({ target: input });
  assert.equal(imported.context.localStorage["startpage-theme-mode"], "dark");
  assert.equal(imported.context.localStorage.obsolete, undefined);
  assert.equal(imported.context.reloaded, true);
  assert.equal(input.value, "");

  const invalid = createContext({ keep: "safe" });
  await invalid.context.importStartPageData({
    target: {
      files: [{ text: async () => "{\"not\":\"a backup\"}" }],
      value: "invalid.json",
    },
  });
  assert.equal(invalid.context.localStorage.keep, "safe");
  assert.equal(invalid.context.reloaded, undefined);
  assert.equal(invalid.status.isError, true);

  console.log("Backup tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
