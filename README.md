# Bg Free

A background-removal tool that runs entirely client-side — no uploads, no server. Uses [@imgly/background-removal](https://github.com/imgly/background-removal-js) (an ISNet ONNX model via WebAssembly) plus a few post-processing passes tuned against a small objective test harness.

Each version is a single self-contained `index.html` (the model library is bundled inline) plus an optional `coi-serviceworker.js` that unlocks multi-threaded WASM on static hosts like GitHub Pages.

## Versions

- **v1** — frozen baseline: background removal, edge-smoothing/guided-snap/interior-hole-fill quality passes, Airbnb-style UI.
- **v2** — active development: dark mode (default), Magic Brush (erase/restore), background photo library + blur, flip/undo/redo.

## Running locally

Any static file server works, served from the version folder:

```bash
cd v2 && python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Deploying

Deploy the folder's contents (`index.html` + `coi-serviceworker.js`) together — if the service worker file is missing, the app still works, just without the multi-threading speedup.
