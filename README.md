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
- Left click hits the nearest animal/player or breaks a block, within five blocks.
- Right click places the selected block. Keys 1-5 select grass, dirt, stone, wood or sand (unlimited building materials).
- Animals take three hits to die and drop a rotating, floating meat item. Walk nearby to pick it up; the notice says Meat and the boxed inventory count increases.
- E consumes one meat and restores six hunger points, up to twenty.
- Red pixel hearts show health; pixel turkey legs show hunger. Hunger drains one point per fifteen active simulation seconds. Empty hunger costs one health per two seconds.
- Falls beyond three blocks deal damage; player hits deal two health. Death automatically respawns at the center with full health/hunger and no meat.

## Architecture And Trust

Rendering, collision physics, fall damage, hunger, starvation and animal movement run on PCs. The server performs one bounded world initialization when the first player connects, not a simulation loop. The first connected client is animal host and sends positions at 5 Hz; others interpolate. On disconnect the server elects the next connected client and sends its latest animal snapshot. An idle socket times out after 45 seconds. Background browser throttling can temporarily slow animals until the host resumes or disconnects.

The server coordinates animal health/death, single-winner meat pickup, proximity checks, PvP damage events, blocks and snapshots. Animal state updates cannot recreate dead animals or alter health. Reconnect discards old scene objects and loads the complete authoritative snapshot, including an empty world; each connection starts a new player life. World, animal deaths and uncollected drops survive disconnects, but not a server restart. Inventory and survival are local and reset on reconnect. There are twelve animals per server lifetime; no automatic breeding/respawning.

This is a trusted-friends prototype, not an anti-cheat server. Clients can spoof their positions, ignore health damage or alter inventory, and the elected host can cheat animal movement within bounds. Server proximity checks use reported positions, not authoritative physics; server-side wall/line-of-sight validation is not implemented. The normal client raycast prevents hitting through blocks. Do not expose this as a competitive public server without authentication, abuse controls and an authoritative redesign.

## Low-Resource Deployment

For a reported 0.1 CPU / 512 MB machine, begin with two to four friends. Eight connections is a hard room limit, not a performance guarantee. No load benchmark on that hardware has been performed. Use a single Node process and single instance; there is no shared storage or multi-instance synchronization.

- Install with `npm ci` when using the lockfile; start with `npm start`.
- Set `PORT` in the hosting platform or shell (default 3000); `.env` files are not automatically loaded.
- Configure HTTPS and WebSocket upgrade forwarding in your reverse proxy; the browser selects WSS automatically on HTTPS. Keep proxy idle timeout above 45 seconds.
- Render/Railway-style services: build command `npm ci`, start command `npm start`. The included Procfile also runs the Node server.
- Player updates are 10 Hz; animal updates are 5 Hz. Server messages are event-driven, with no periodic physics/survival/animal tick.
- Inbound frames are limited to 32 KiB, each connection to 40 messages/second, and outgoing backlog to 256 KiB before disconnect. Compression is disabled to save CPU. Initial snapshots are larger than the inbound limit but bounded by the world.
- Block coordinates are bounded to 32 x 49 x 32; animals and drops cannot grow beyond the initial twelve. Only explicitly allowed frontend files are served.
- Block geometry/materials are shared. Fully enclosed blocks are hidden and neighboring visibility is refreshed after edits. Shadows are disabled, pixel ratio is capped at 1.5, and Three.js performs frustum culling. This still uses individual block meshes, not chunk meshing or instancing.

## Verification

`npm test` runs a real server with two WebSocket clients, then reconnects a replacement client. It covers identical initialization, host-only animal updates, PvP, three-hit animal death, single-winner pickup, block edits, host handoff, snapshot recovery and private-file HTTP denial. `npm run check` syntax-checks JavaScript. These are protocol tests, not automated WebGL or pointer-lock tests; visually check movement, fall landings, icons and clicking in two real browser windows before deployment.
