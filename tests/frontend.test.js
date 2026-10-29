const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const html = fs.readFileSync(path.resolve(__dirname, "../frontend/app/index.html"), "utf8");
const reader = html.match(/function readLocalLibrary\(\) \{[\s\S]*?(?=\n    function writeLocalLibrary)/)[0];
const keys = [...html.matchAll(/const (?:LEGACY_)?LIBRARY_STORAGE_KEY = "[^"]+";/g)].map(match => match[0]).join("\n");
function context(values) {
  const storage = new Map(Object.entries(values));
  const scope = vm.createContext({ localStorage: {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, value)
  } });
  vm.runInContext(`${keys}\n${reader}`, scope);
  return { storage, read: () => JSON.parse(JSON.stringify(vm.runInContext("readLocalLibrary()", scope))) };
}
test("renaming migrates existing local records without overwriting the new library", () => {
  const records = [{ id: "previous-battle", title: "Saved battle" }];
  const old = context({ "ai-arena-duel-library": JSON.stringify(records) });
  assert.deepEqual(old.read(), records);
  assert.deepEqual(JSON.parse(old.storage.get("ai-duelpop-library")), records);
  const current = context({ "ai-arena-duel-library": JSON.stringify(records), "ai-duelpop-library": "[]" });
  assert.deepEqual(current.read(), []);
});
