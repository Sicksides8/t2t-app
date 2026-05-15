# Firebase (T2T Academy)

Reglas e índices en este directorio (`firestore.rules`, `storage.rules`, `firestore.indexes.json`).

## Seed de datos de ejemplo

Script Node con Admin SDK: [`scripts/seed-t2t.mjs`](scripts/seed-t2t.mjs).

```bash
cd /ruta/al/monorepo
export GOOGLE_APPLICATION_CREDENTIALS=/ruta/serviceAccount.json
npm install
npm run seed:firestore
```

Eliminar solo documentos generados por el seed (IDs `seed_*`, códigos `SEED-T2T-*`). **No borra** habilidades base (`t2t_skills/liderazgo`, etc.).

```bash
npm run seed:firestore -- --clear
```
