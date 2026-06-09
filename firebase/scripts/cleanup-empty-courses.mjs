/**
 * Detecta cursos en t2t_courses sin lecciones reales y los desactiva (isActive=false)
 * o los borra (con --delete). En la app móvil esos cursos muestran "No hay lecciones cargadas".
 *
 * Uso:
 *   export GOOGLE_APPLICATION_CREDENTIALS=apps/web-crm/serviceAccount.json
 *
 *   node firebase/scripts/cleanup-empty-courses.mjs            # dry-run, no toca nada
 *   node firebase/scripts/cleanup-empty-courses.mjs --apply    # aplica isActive=false
 *   node firebase/scripts/cleanup-empty-courses.mjs --apply --delete  # borra los huérfanos
 */

import admin from 'firebase-admin';

const FLAG_APPLY = process.argv.includes('--apply');
const FLAG_DELETE = process.argv.includes('--delete');

const COL = {
  courses: 't2t_courses',
  modules: 't2t_modules',
  lessons: 't2t_lessons',
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function listEmptyCourses() {
  const snapshot = await db.collection(COL.courses).get();
  const results = [];
  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const [modulesSnap, lessonsSnap] = await Promise.all([
      db.collection(COL.modules).where('courseId', '==', doc.id).count().get(),
      db.collection(COL.lessons).where('courseId', '==', doc.id).count().get(),
    ]);
    const moduleCount = modulesSnap.data().count;
    const lessonCount = lessonsSnap.data().count;
    if (lessonCount === 0) {
      results.push({
        id: doc.id,
        title: data.title || '(sin título)',
        isActive: data.isActive !== false,
        totalLessons: data.totalLessons ?? null,
        moduleCount,
        lessonCount,
      });
    }
  }
  return results;
}

async function main() {
  const empties = await listEmptyCourses();
  if (empties.length === 0) {
    console.log('No hay cursos vacíos. Todo bien.');
    return;
  }

  console.log(`Cursos sin lecciones detectados (${empties.length}):`);
  for (const c of empties) {
    console.log(
      ` - ${c.id} | active=${c.isActive} | totalLessons=${c.totalLessons} | mods=${c.moduleCount} | "${c.title}"`,
    );
  }

  if (!FLAG_APPLY) {
    console.log('\nDry-run: no se modificó nada. Repetí con --apply para desactivarlos.');
    if (!FLAG_DELETE) {
      console.log('Repetí con --apply --delete para borrarlos del catálogo.');
    }
    return;
  }

  const batch = db.batch();
  for (const c of empties) {
    const ref = db.collection(COL.courses).doc(c.id);
    if (FLAG_DELETE) {
      batch.delete(ref);
    } else {
      batch.update(ref, { isActive: false, updatedAt: new Date() });
    }
  }
  await batch.commit();

  console.log(
    `\nListo. ${FLAG_DELETE ? 'Borrados' : 'Desactivados'}: ${empties.length} cursos.`,
  );
}

main().catch((err) => {
  console.error('Error:', err);
  process.exitCode = 1;
});
