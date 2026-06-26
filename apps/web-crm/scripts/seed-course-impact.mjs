/**
 * One-shot: rellena skillImpact y planOrder en cursos con courseCode C1–C12.
 *
 * Uso (desde apps/web-crm con credenciales Admin):
 *   node scripts/seed-course-impact.mjs
 *
 * Requiere GOOGLE_APPLICATION_CREDENTIALS o ADC.
 */

import admin from 'firebase-admin';

const P = 't2t_';

/** Solapa 7 Excel v8.0 — impacto gᵢ por curso. */
const IMPACT_BY_CODE = {
  C1: { influencia: 0.1, adaptabilidad: 0.15, productividad: 0.2, aprendizaje: 0.45 },
  C2: { influencia: 0.1, adaptabilidad: 0.2, productividad: 0.1, aprendizaje: 0.15 },
  C3: { liderazgo: 0.25, influencia: 0.1, equipo: 0.1, resolucion: 0.15, escucha: 0.2 },
  C4: { adaptabilidad: 0.1, productividad: 0.2 },
  C5: { resolucion: 0.3, escucha: 0.1, aprendizaje: 0.15 },
  C6: { liderazgo: 0.3, comunicacion: 0.15, equipo: 0.15 },
  C7: { comunicacion: 0.2, escucha: 0.3 },
  C8: { resolucion: 0.1, productividad: 0.3 },
  C9: { adaptabilidad: 0.2, gestionEmocional: 0.3 },
  C10: { adaptabilidad: 0.15, comunicacion: 0.1, equipo: 0.15, aprendizaje: 0.2 },
  C11: { liderazgo: 0.15, creatividad: 0.25, aprendizaje: 0.15 },
  C12: { productividad: 0.25, aprendizaje: 0.1, gestionEmocional: 0.15 },
};

/** Solapa 10 — orden plan Beta. */
const PLAN_ORDER = {
  C1: 1,
  C2: 2,
  C12: 3,
  C3: 4,
  C4: 5,
  C5: 6,
  C6: 7,
  C7: 8,
  C8: 9,
  C9: 10,
  C10: 11,
  C11: 12,
};

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function main() {
  const snap = await db.collection(`${P}courses`).get();
  let updated = 0;
  for (const doc of snap.docs) {
    const code = String(doc.data().courseCode || '').trim().toUpperCase();
    if (!code || !IMPACT_BY_CODE[code]) continue;
    await doc.ref.update({
      skillImpact: IMPACT_BY_CODE[code],
      planOrder: PLAN_ORDER[code] ?? null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    updated += 1;
    console.log(`Updated ${code} (${doc.id})`);
  }
  console.log(`Done. ${updated} courses patched.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
