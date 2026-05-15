/**
 * Seed masivo Firestore (colecciones t2t_*).
 *
 * Credenciales Admin:
 *   export GOOGLE_APPLICATION_CREDENTIALS=ruta/al/serviceAccount.json
 *
 * Uso:
 *   npm run seed:firestore
 *   npm run seed:firestore -- --clear
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const P = 't2t_';
const COL = {
  skills: `${P}skills`,
  courses: `${P}courses`,
  modules: `${P}modules`,
  lessons: `${P}lessons`,
  plans: `${P}plans`,
  subscriptionCodes: `${P}subscription_codes`,
  weeklyChallenges: `${P}weekly_challenges`,
  achievements: `${P}achievements`,
  coinsTransactions: `${P}coins_transactions`,
};

const SKILL_IDS = ['liderazgo', 'influencia', 'adaptabilidad', 'comunicacion', 'productividad'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

/** Mismo mock que apps/mobile/src/constants/media.ts */
const MOCK_VIDEO_URL = 'https://pub-cbb826460242448e83ebe8b4ed4e375e.r2.dev/t2t-video-mock.mp4';

const COURSE_TITLES_BY_SKILL = {
  liderazgo: [
    'Liderazgo humano para equipos modernos',
    'Feedback que transforma equipos',
    'Conversaciones difíciles con calma',
    'Delegar con confianza',
    'Cultura de equipo de alto rendimiento',
  ],
  influencia: [
    'Presencia y credibilidad profesional',
    'Storytelling para mover decisiones',
    'Negociar sin fricción',
    'Influencia sin autoridad formal',
  ],
  adaptabilidad: [
    'Mentalidad ágil ante el cambio',
    'Decidir con información incompleta',
    'Resiliencia en proyectos inciertos',
    'Aprender rápido del error',
  ],
  comunicacion: [
    'Comunicación efectiva en situaciones tensas',
    'Escucha activa en equipos híbridos',
    'Presentaciones que convencen',
    'Mensajes claros por escrito',
    'Reuniones que ahorran tiempo',
  ],
  productividad: [
    'Sistema personal de productividad',
    'Energía y foco profundo',
    'Priorizar cuando todo es urgente',
    'Rituales de cierre semanal',
  ],
};

const SKILLS = [
  { id: 'liderazgo', name: 'Liderazgo', description: 'Dirigir equipos con claridad humana.', icon: 'sparkles', color: '#B73CEF', order: 1 },
  { id: 'influencia', name: 'Influencia', description: 'Comunicar ideas que movilizan.', icon: 'megaphone', color: '#4CC35B', order: 2 },
  { id: 'adaptabilidad', name: 'Adaptabilidad', description: 'Responder mejor al cambio.', icon: 'git-branch', color: '#25BFA5', order: 3 },
  { id: 'comunicacion', name: 'Comunicación', description: 'Expresar, escuchar y conectar.', icon: 'chatbubbles', color: '#FFB547', order: 4 },
  { id: 'productividad', name: 'Productividad', description: 'Avanzar con foco y energía.', icon: 'timer', color: '#FF5C7A', order: 5 },
];

function initAdmin() {
  if (admin.apps.length) return;
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const json = JSON.parse(readFileSync(credPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(json) });
    return;
  }
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}

async function chunkCommit(writeFns) {
  const db = admin.firestore();
  let batch = db.batch();
  let n = 0;
  for (const fn of writeFns) {
    fn(batch);
    n++;
    if (n >= 400) {
      await batch.commit();
      batch = db.batch();
      n = 0;
    }
  }
  if (n > 0) await batch.commit();
}

function buildWrites() {
  const writes = [];
  const ts = admin.firestore.FieldValue.serverTimestamp();

  for (const s of SKILLS) {
    writes.push((b) =>
      b.set(
        admin.firestore().collection(COL.skills).doc(s.id),
        { ...s, isActive: true, updatedAt: ts, createdAt: ts },
        { merge: true },
      ),
    );
  }

  const plans = [
    {
      id: 'seed_plan_starter',
      name: 'Starter',
      price: 0,
      currency: 'ARS',
      durationDays: 14,
      features: ['Diagnóstico completo', 'Curso inicial', 'Progreso y coins'],
      isActive: true,
      order: 1,
    },
    {
      id: 'seed_plan_academy',
      name: 'Academy',
      price: 12900,
      currency: 'ARS',
      durationDays: 365,
      features: ['Catálogo completo', 'Certificados', 'Desafíos semanales'],
      isActive: true,
      order: 2,
    },
  ];
  for (const p of plans) {
    writes.push((b) =>
      b.set(admin.firestore().collection(COL.plans).doc(p.id), { ...p, updatedAt: ts, createdAt: ts }, { merge: true }),
    );
  }

  const nCourses = 30;
  for (let i = 1; i <= nCourses; i++) {
    const id = `seed_course_${String(i).padStart(3, '0')}`;
    const skillId = SKILL_IDS[(i - 1) % SKILL_IDS.length];
    const titles = COURSE_TITLES_BY_SKILL[skillId];
    const level = LEVELS[(i - 1) % LEVELS.length];
    const title = titles[Math.floor((i - 1) / SKILL_IDS.length) % titles.length];
    const description = `${title}. Curso de ejemplo para explorar la categoría ${skillId}. Incluye micro-lecciones en video y prácticas aplicables al trabajo.`;
    const course = {
      id,
      title,
      skillId,
      description,
      thumbnail: `https://picsum.photos/seed/t2t${i}/400/240`,
      totalLessons: 8,
      durationMin: 40 + (i % 12) * 6,
      level,
      isActive: true,
      isPremium: i % 4 === 0,
      order: 100 + i,
    };
    writes.push((b) =>
      b.set(admin.firestore().collection(COL.courses).doc(id), { ...course, updatedAt: ts, createdAt: ts }, { merge: true }),
    );

    const nMod = 2 + (i % 2);
    for (let m = 1; m <= nMod; m++) {
      const modId = `${id}_m${m}`;
      const mod = {
        id: modId,
        courseId: id,
        title: `Módulo ${m}: prácticas guiadas`,
        order: m,
        totalLessons: 4,
      };
      writes.push((b) =>
        b.set(admin.firestore().collection(COL.modules).doc(modId), { ...mod, updatedAt: ts, createdAt: ts }, { merge: true }),
      );

      for (let L = 1; L <= 4; L++) {
        const lessonId = `${modId}_l${L}`;
        const lesson = {
          id: lessonId,
          courseId: id,
          moduleId: modId,
          title: `Lección ${L}: aplicación práctica (${skillId})`,
          videoUrl: MOCK_VIDEO_URL,
          durationSec: 420 + L * 45 + i * 3,
          order: L,
          isFree: L === 1,
        };
        writes.push((b) =>
          b.set(admin.firestore().collection(COL.lessons).doc(lessonId), { ...lesson, updatedAt: ts, createdAt: ts }, { merge: true }),
        );
      }
    }
  }

  for (let i = 1; i <= 15; i++) {
    const code = `SEED-T2T-${String(i).padStart(3, '0')}`;
    writes.push((b) =>
      b.set(
        admin.firestore().collection(COL.subscriptionCodes).doc(code),
        {
          planId: i % 2 === 0 ? 'seed_plan_academy' : 'seed_plan_starter',
          durationDays: 30 + i,
          used: false,
          createdAt: ts,
          updatedAt: ts,
        },
        { merge: true },
      ),
    );
  }

  for (let i = 1; i <= 8; i++) {
    const id = `seed_challenge_${String(i).padStart(2, '0')}`;
    writes.push((b) =>
      b.set(
        admin.firestore().collection(COL.weeklyChallenges).doc(id),
        {
          title: `Desafío semana ${i}: feedback efectivo`,
          description: `Completa ${i + 2} micro-acciones de comunicación.`,
          xpReward: 50 + i * 10,
          active: true,
          order: i,
          updatedAt: ts,
          createdAt: ts,
        },
        { merge: true },
      ),
    );
  }

  for (let i = 1; i <= 12; i++) {
    const id = `seed_achievement_${String(i).padStart(2, '0')}`;
    writes.push((b) =>
      b.set(
        admin.firestore().collection(COL.achievements).doc(id),
        {
          title: `Logro demo ${i}`,
          description: `Desbloqueado al completar hitos de práctica ${i}.`,
          icon: 'trophy',
          points: i * 5,
          updatedAt: ts,
          createdAt: ts,
        },
        { merge: true },
      ),
    );
  }

  for (let i = 1; i <= 10; i++) {
    const id = `seed_coin_tx_${String(i).padStart(2, '0')}`;
    writes.push((b) =>
      b.set(
        admin.firestore().collection(COL.coinsTransactions).doc(id),
        {
          userId: 'demo_user',
          amount: 10 + (i % 3) * 5,
          type: 'earned',
          reason: i % 2 === 0 ? 'Lección completada' : 'Desafío semanal',
          createdAt: ts,
        },
        { merge: true },
      ),
    );
  }

  return writes;
}

async function clearKnownSeedDocs() {
  const db = admin.firestore();
  const paths = [];

  paths.push(`${COL.plans}/seed_plan_starter`, `${COL.plans}/seed_plan_academy`);

  for (let i = 1; i <= 30; i++) {
    const cid = `seed_course_${String(i).padStart(3, '0')}`;
    paths.push(`${COL.courses}/${cid}`);
    const nMod = 2 + (i % 2);
    for (let m = 1; m <= nMod; m++) {
      const modId = `${cid}_m${m}`;
      paths.push(`${COL.modules}/${modId}`);
      for (let L = 1; L <= 4; L++) {
        paths.push(`${COL.lessons}/${modId}_l${L}`);
      }
    }
  }
  for (let i = 1; i <= 15; i++) {
    paths.push(`${COL.subscriptionCodes}/SEED-T2T-${String(i).padStart(3, '0')}`);
  }
  for (let i = 1; i <= 8; i++) paths.push(`${COL.weeklyChallenges}/seed_challenge_${String(i).padStart(2, '0')}`);
  for (let i = 1; i <= 12; i++) paths.push(`${COL.achievements}/seed_achievement_${String(i).padStart(2, '0')}`);

  let batch = db.batch();
  let n = 0;
  for (const path of paths) {
    batch.delete(db.doc(path));
    if (++n >= 400) {
      await batch.commit();
      batch = db.batch();
      n = 0;
    }
  }
  if (n > 0) await batch.commit();
  console.log(`Clear OK: ${paths.length} documentos seed eliminados.`);
}

async function seed() {
  const writes = buildWrites();
  await chunkCommit(writes);
  console.log(`Seed OK: ${writes.length} operaciones de escritura (merge).`);
}

const args = process.argv.slice(2);
initAdmin();

if (args.includes('--clear')) {
  clearKnownSeedDocs().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else {
  seed().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
