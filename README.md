# Multiplayer Voxel Survival

Small shared 32 x 32 world with multiplayer building, roaming block animals, combat and survival. Desktop keyboard/mouse and WebGL are required; the HUD wraps on narrow screens, but touch controls are not implemented.

## Run

Use a supported Node.js LTS release (Node 22 or newer recommended).

```sh
npm install
npm test
npm run check
npm start
```

Open http://localhost:3000 in two browser windows. Three.js is loaded from the pinned jsDelivr import map, so browsers need internet access.

## Controls

- Click the start panel to capture the mouse; Escape releases it.
- WASD moves, mouse looks, Space jumps.
- In the inventory, left click picks up, places, merges, or swaps a stack; right click picks up half or places one item. Drag while carrying to distribute, double-click to gather matching items, and Shift-click to quick-transfer between inventory sections. Focus a slot and use arrows, Enter/Space, Context Menu or Shift+F10, Shift+Enter, or 1-9 for keyboard controls.
- Inventory interactions follow modern Java Edition survival rules, adapted to this prototype's 36-slot player inventory, optional 27-slot backpack, and 64-item stack limit (tools/backpacks stack to one). Releasing a carried stack outside the inventory returns it to inventory because there is no world item-drop system. Closing returns crafting inputs and the cursor stack when capacity allows.
- The player inventory has a 2x2 crafting grid. Craft a crafting table from four planks, place it, then right-click it to open a 3x3 grid for wooden/stone tools and an 8-plank backpack. The backpack adds 27 storage slots; nested backpacks are not allowed. Tools have no durability and improve mining speed on matching materials.
- Left click hits the nearest animal/player or mines a block within five blocks. Hit targets jump and flash red for one second. Pickaxes mine stone faster, axes mine wood/planks faster, and shovels mine dirt/grass/sand faster.
- Right click uses the held item: places a block, eats a held porkchop when hungry, or opens a placed crafting table. Keys 1-9 select hotbar slots; Q opens the inventory.
- Day/night uses an accelerated four-minute cycle (two minutes day, two minutes night) so the transition is easy to observe; the status panel shows the in-game clock.
- Animals take three hits to die and drop a rotating, floating meat item. Walk nearby to pick it up; the notice says Meat and the boxed inventory count increases.
- E consumes one meat and restores six hunger points, up to twenty.
- Red pixel hearts show health; pixel turkey legs show hunger. Hunger drains one point per fifteen active simulation seconds. Empty hunger costs one health per two seconds.
- Falls beyond three blocks deal damage; player hits deal two health. Death automatically respawns at the center with full health/hunger and no meat.

## Architecture And Trust

Rendering, collision physics, fall damage, hunger, starvation and animal movement run on PCs. Every client generates the identical terrain and trees locally from a shared deterministic formula, then replays the server's list of player block edits; the server never stores or transmits terrain. The first connected client is animal host and sends positions at 5 Hz; others interpolate. On disconnect the server elects the next connected client and sends its latest animal snapshot. An idle socket times out after 45 seconds. Background browser throttling can temporarily slow animals until the host resumes or disconnects.

The server coordinates animal health/death, single-winner meat pickup, proximity checks, PvP damage events, blocks and snapshots. Animal state updates cannot recreate dead animals or alter health. Reconnect discards old scene objects and loads the complete authoritative snapshot, including an empty world; each connection starts a new player life. World, animal deaths and uncollected drops survive disconnects, but not a server restart. Inventory and survival are local and reset on reconnect. There are twelve animals per server lifetime; no automatic breeding/respawning.

This is a trusted-friends prototype, not an anti-cheat server. Clients can spoof their positions, ignore health damage or alter inventory, and the elected host can cheat animal movement within bounds. Server proximity checks use reported positions, not authoritative physics; server-side wall/line-of-sight validation is not implemented. The normal client raycast prevents hitting through blocks. Do not expose this as a competitive public server without authentication, abuse controls and an authoritative redesign.

## Low-Resource Deployment

For a reported 0.1 CPU / 512 MB machine, begin with two to four friends. Eight connections is a hard room limit, not a performance guarantee. No load benchmark on that hardware has been performed. Use a single Node process and single instance; there is no shared storage or multi-instance synchronization.

- Install with `npm ci` when using the lockfile; start with `npm start`.
- Set `PORT` in the hosting platform or shell (default 3000); `.env` files are not automatically loaded.
- Configure HTTPS and WebSocket upgrade forwarding in your reverse proxy; the browser selects WSS automatically on HTTPS. Keep proxy idle timeout above 45 seconds.
- Render/Railway-style services: build command `npm ci`, start command `npm start`. The included Procfile also runs the Node server.
- Player updates are 10 Hz; animal updates are 5 Hz. Server messages are event-driven, with no periodic physics/survival/animal tick.
- Inbound frames are limited to 32 KiB, each connection to 40 messages/second, and outgoing backlog to 256 KiB before disconnect. Compression is disabled to save CPU. Initial snapshots contain only player block edits, so they stay tiny regardless of world size.
- Block coordinates are bounded to the 128 x 49 x 128 world; animals and drops cannot grow beyond the initial twenty-four. Only explicitly allowed frontend files are served.
- Rendering uses a chunked mesher: each 16x16 column chunk is merged into one mesh per material containing only exposed faces (~49k quads for the entire terrain in ~100 meshes instead of 50k+ individual block meshes), chunk meshes have frozen matrices, edits rebuild only the affected chunks, and the mob AI loop is allocation-free. Shadows are disabled, pixel ratio is capped at 1.5, and Three.js frustum-culls whole chunks.

## Verification

`npm test` runs a real server with two WebSocket clients, then reconnects a replacement client. It covers identical initialization, host-only animal updates, PvP, three-hit animal death, single-winner pickup, block edits, host handoff, snapshot recovery and private-file HTTP denial. `npm run check` syntax-checks JavaScript. These are protocol tests, not automated WebGL or pointer-lock tests; visually check movement, fall landings, icons and clicking in two real browser windows before deployment.
