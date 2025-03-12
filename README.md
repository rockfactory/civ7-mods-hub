# civ7-mods-hub

Unofficial Civ7 Mods Manager

## Develop

Download and Start Pocketbase v0.25.9 in `./apps/backend`:

```bash
./apps/backend/pocketbase.exe serve
```

Start the Desktop App in `./apps/desktop`:

```bash
npm run -w @civmods/desktop tauri dev
```

To update PocketBase Typescript types:

```bash
npx pocketbase-typegen --db ./apps/backend/pb_data/data.db --out ./apps/desktop/src/pocketbase-types.ts
```
