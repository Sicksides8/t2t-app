'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, EyeOff, Trash2 } from 'lucide-react';
import { AdminPage, type AdminColumn } from './AdminPage';
import { CourseFormModal } from './courses/CourseFormModal';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useToast } from './ui/Toast';
import { apiFetch } from '../lib/api';
import {
  ACCESS_TIER_LABEL,
  ACCESS_TIER_OPTIONS,
  LEGACY_LEVEL_LABEL,
  LEVEL_OPTIONS,
} from '../lib/courseConstants';
import type { Course, CourseAccessTier } from '../types';
import styles from '../app/dashboard.module.css';
import filterStyles from './CoursesFilters.module.css';
import modalStyles from './courses/CourseModal.module.css';

type DurationFilter = 'all' | 'short' | 'medium' | 'long';
type StatusFilter = 'all' | 'active' | 'inactive';
type TierFilter = 'all' | CourseAccessTier;

function tierFromCourse(course: Course): CourseAccessTier {
  if (course.accessTier) return course.accessTier;
  return course.isPremium ? 'lite' : 'free';
}

function skillLabel(skillId: string): string {
  if (!skillId) return '—';
  return skillId.charAt(0).toUpperCase() + skillId.slice(1);
}

export function CoursesView() {
  const toast = useToast();
  const [rows, setRows] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Course[]>('/api/admin/courses?includeInactive=1');
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  async function toggleActive(course: Course) {
    const next = !course.isActive;
    setTogglingId(course.id);
    setRows((prev) => prev.map((r) => (r.id === course.id ? { ...r, isActive: next } : r)));
    try {
      await apiFetch<Course>(`/api/admin/courses/${course.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: next }),
      });
      toast.show({
        tone: 'success',
        message: next ? `"${course.title}" ahora se ve en la app.` : `"${course.title}" quedó oculto en la app.`,
      });
    } catch (err) {
      setRows((prev) => prev.map((r) => (r.id === course.id ? { ...r, isActive: course.isActive } : r)));
      toast.show({
        tone: 'error',
        title: 'No se pudo actualizar',
        message: err instanceof Error ? err.message : 'Error desconocido',
      });
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await apiFetch<{ deletedLessons: number; r2Deleted: number; r2Failed: number }>(
        `/api/admin/courses/${deleteTarget.id}`,
        { method: 'DELETE' },
      );
      const detail =
        result.r2Deleted > 0
          ? ` (${result.deletedLessons} módulos, ${result.r2Deleted} archivos en R2)`
          : ` (${result.deletedLessons} módulos)`;
      toast.show({
        tone: 'success',
        title: 'Curso eliminado',
        message: `Borramos "${deleteTarget.title}"${detail}.`,
      });
      setDeleteTarget(null);
      await loadCourses();
    } catch (err) {
      toast.show({
        tone: 'error',
        title: 'No se pudo eliminar',
        message: err instanceof Error ? err.message : 'Error desconocido',
      });
    } finally {
      setDeleting(false);
    }
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(visibleIds: string[]) {
    setSelected((prev) => {
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        for (const id of visibleIds) next.delete(id);
        return next;
      }
      const next = new Set(prev);
      for (const id of visibleIds) next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function runBulk(action: 'activate' | 'deactivate' | 'delete') {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      let results: PromiseSettledResult<unknown>[] = [];
      if (action === 'delete') {
        results = await Promise.allSettled(
          ids.map((id) => apiFetch(`/api/admin/courses/${id}`, { method: 'DELETE' })),
        );
      } else {
        const isActive = action === 'activate';
        results = await Promise.allSettled(
          ids.map((id) =>
            apiFetch(`/api/admin/courses/${id}`, {
              method: 'PATCH',
              body: JSON.stringify({ isActive }),
            }),
          ),
        );
      }
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - ok;
      const verb =
        action === 'delete' ? 'Eliminados' : action === 'activate' ? 'Activados' : 'Desactivados';
      if (failed === 0) {
        toast.show({
          tone: 'success',
          title: `${verb} ${ok} cursos`,
          message: 'Operación masiva completada.',
        });
      } else if (ok === 0) {
        toast.show({
          tone: 'error',
          title: `No se pudo aplicar la acción`,
          message: `Falló en los ${failed} cursos seleccionados.`,
        });
      } else {
        toast.show({
          tone: 'info',
          title: `${verb} ${ok} de ${results.length}`,
          message: `${failed} fallaron. Revisá la consola para detalles.`,
        });
      }
      clearSelection();
      setBulkAction(null);
      await loadCourses();
    } finally {
      setBulkBusy(false);
    }
  }

  const skillOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      const id = (row.skillId || '').trim();
      if (id) set.add(id);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (needle && !row.title.toLowerCase().includes(needle)) return false;
      if (skillFilter !== 'all' && (row.skillId || '').toLowerCase() !== skillFilter.toLowerCase())
        return false;
      if (levelFilter !== 'all' && row.level !== levelFilter) return false;
      if (tierFilter !== 'all' && tierFromCourse(row) !== tierFilter) return false;
      if (statusFilter === 'active' && !row.isActive) return false;
      if (statusFilter === 'inactive' && row.isActive) return false;
      const duration = Number(row.durationMin || 0);
      if (durationFilter === 'short' && duration >= 15) return false;
      if (durationFilter === 'medium' && (duration < 15 || duration > 30)) return false;
      if (durationFilter === 'long' && duration <= 30) return false;
      return true;
    });
  }, [rows, search, skillFilter, levelFilter, tierFilter, durationFilter, statusFilter]);

  const filtersActive =
    Boolean(search.trim()) ||
    skillFilter !== 'all' ||
    levelFilter !== 'all' ||
    tierFilter !== 'all' ||
    durationFilter !== 'all' ||
    statusFilter !== 'all';

  const nextOrder = rows.reduce((max, row) => Math.max(max, row.order ?? 0), 0) + 1;

  const columns: AdminColumn<Course>[] = [
    {
      key: 'title',
      label: 'Curso',
      render: (row) => (
        <Link href={`/courses/${row.id}`} className={styles.rowLink}>
          {row.title}
        </Link>
      ),
    },
    {
      key: 'skillId',
      label: 'Habilidad',
      render: (row) => skillLabel(row.skillId),
    },
    {
      key: 'level',
      label: 'Nivel',
      render: (row) => LEGACY_LEVEL_LABEL[row.level] || row.level,
    },
    {
      key: 'accessTier',
      label: 'Acceso',
      render: (row) => {
        const tier = tierFromCourse(row);
        return (
          <span className={`${filterStyles.tierPill} ${filterStyles[`tierPill_${tier}`]}`}>
            {ACCESS_TIER_LABEL[tier]}
          </span>
        );
      },
    },
    {
      key: 'durationMin',
      label: 'Duracion',
      render: (row) => `${row.durationMin} min · ${row.totalLessons} mod.`,
    },
    {
      key: 'isActive',
      label: 'Visible en app',
      render: (row) => {
        const busy = togglingId === row.id;
        return (
          <button
            type="button"
            className={`${filterStyles.toggle} ${row.isActive ? filterStyles.toggleOn : ''}`}
            role="switch"
            aria-checked={row.isActive}
            aria-label={row.isActive ? `Desactivar ${row.title}` : `Activar ${row.title}`}
            disabled={busy}
            onClick={() => toggleActive(row)}
          >
            <span className={filterStyles.toggleKnob} />
            <span className={filterStyles.toggleLabel}>{row.isActive ? 'Activo' : 'Oculto'}</span>
          </button>
        );
      },
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className={modalStyles.rowActions}>
          <button
            type="button"
            className={modalStyles.secondaryBtn}
            onClick={() => setEditId(row.id)}
          >
            Editar
          </button>
          <button
            type="button"
            className={filterStyles.iconDangerBtn}
            aria-label={`Eliminar ${row.title}`}
            title="Eliminar curso"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const filtersBar = (
    <div className={filterStyles.filtersBar}>
      <input
        type="search"
        className={filterStyles.searchInput}
        placeholder="Buscar por título..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Buscar curso"
      />
      <select
        className={filterStyles.select}
        value={skillFilter}
        onChange={(e) => setSkillFilter(e.target.value)}
        aria-label="Filtrar por habilidad"
      >
        <option value="all">Todas las habilidades</option>
        {skillOptions.map((opt) => (
          <option key={opt} value={opt}>
            {skillLabel(opt)}
          </option>
        ))}
      </select>
      <select
        className={filterStyles.select}
        value={levelFilter}
        onChange={(e) => setLevelFilter(e.target.value)}
        aria-label="Filtrar por nivel"
      >
        <option value="all">Todos los niveles</option>
        {LEVEL_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        className={filterStyles.select}
        value={tierFilter}
        onChange={(e) => setTierFilter(e.target.value as TierFilter)}
        aria-label="Filtrar por tipo de acceso"
      >
        <option value="all">Cualquier acceso</option>
        {ACCESS_TIER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        className={filterStyles.select}
        value={durationFilter}
        onChange={(e) => setDurationFilter(e.target.value as DurationFilter)}
        aria-label="Filtrar por duración"
      >
        <option value="all">Cualquier duración</option>
        <option value="short">Corto (&lt; 15 min)</option>
        <option value="medium">Medio (15 a 30 min)</option>
        <option value="long">Largo (&gt; 30 min)</option>
      </select>
      <select
        className={filterStyles.select}
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        aria-label="Filtrar por estado"
      >
        <option value="all">Activos y ocultos</option>
        <option value="active">Solo activos</option>
        <option value="inactive">Solo ocultos</option>
      </select>
      {filtersActive ? (
        <button
          type="button"
          className={filterStyles.clearBtn}
          onClick={() => {
            setSearch('');
            setSkillFilter('all');
            setLevelFilter('all');
            setTierFilter('all');
            setDurationFilter('all');
            setStatusFilter('all');
          }}
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );

  const emptyMessage = filtersActive
    ? 'Ningún curso coincide con los filtros. Probá ajustarlos o limpiarlos.'
    : 'No hay cursos. Crea el primero con el botón de arriba.';

  const visibleIds = filteredRows.map((row) => row.id);
  const selectedCount = selected.size;
  const bulkBar = selectedCount > 0 ? (
    <>
      <div className={filterStyles.bulkSummary}>
        <CheckCircle2 size={16} /> {selectedCount} {selectedCount === 1 ? 'curso seleccionado' : 'cursos seleccionados'}
      </div>
      <div className={filterStyles.bulkActions}>
        <button
          type="button"
          className={filterStyles.bulkBtn}
          disabled={bulkBusy}
          onClick={() => setBulkAction('activate')}
        >
          <CheckCircle2 size={14} /> Activar
        </button>
        <button
          type="button"
          className={filterStyles.bulkBtn}
          disabled={bulkBusy}
          onClick={() => setBulkAction('deactivate')}
        >
          <EyeOff size={14} /> Ocultar
        </button>
        <button
          type="button"
          className={filterStyles.bulkBtnDanger}
          disabled={bulkBusy}
          onClick={() => setBulkAction('delete')}
        >
          <Trash2 size={14} /> Eliminar
        </button>
      </div>
      <button
        type="button"
        className={filterStyles.bulkClear}
        disabled={bulkBusy}
        onClick={clearSelection}
      >
        Limpiar selección
      </button>
    </>
  ) : null;

  return (
    <>
      <AdminPage
        title="Cursos"
        description={`Gestión completa: crear, editar, activar/ocultar y eliminar cursos en Firestore (t2t_courses). ${rows.length} cursos · mostrando ${filteredRows.length}.`}
        columns={columns}
        rows={filteredRows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage={emptyMessage}
        selectable
        selectedKeys={selected}
        onToggleKey={(id) => toggleSelected(id)}
        onToggleAll={() => toggleSelectAll(visibleIds)}
        bulkBar={bulkBar}
        headerAction={
          <div className={filterStyles.headerActions}>
            <div className={filterStyles.topRow}>
              <button
                type="button"
                className={filterStyles.createBtn}
                onClick={() => setCreateOpen(true)}
              >
                + Crear curso
              </button>
            </div>
            {filtersBar}
          </div>
        }
      />
      <CourseFormModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSaved={loadCourses}
        nextOrder={nextOrder}
      />
      <CourseFormModal
        open={editId != null}
        mode="edit"
        courseId={editId}
        onClose={() => setEditId(null)}
        onSaved={loadCourses}
      />
      <ConfirmDialog
        open={deleteTarget != null}
        title="¿Eliminar este curso?"
        message={
          deleteTarget
            ? `Vas a borrar "${deleteTarget.title}" y sus ${deleteTarget.totalLessons} módulos, junto con los videos y PDFs en R2. Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        tone="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => (deleting ? null : setDeleteTarget(null))}
      />
      <ConfirmDialog
        open={bulkAction != null}
        title={
          bulkAction === 'delete'
            ? `¿Eliminar ${selectedCount} cursos?`
            : bulkAction === 'activate'
              ? `¿Activar ${selectedCount} cursos?`
              : `¿Ocultar ${selectedCount} cursos?`
        }
        message={
          bulkAction === 'delete'
            ? `Vas a borrar definitivamente ${selectedCount} cursos y todos sus módulos, junto con los videos y PDFs en R2. Esta acción no se puede deshacer.`
            : bulkAction === 'activate'
              ? `Los ${selectedCount} cursos seleccionados se publicarán en la app y serán visibles para los alumnos.`
              : `Los ${selectedCount} cursos seleccionados quedarán ocultos en la app. Podés reactivarlos cuando quieras.`
        }
        confirmLabel={
          bulkAction === 'delete' ? `Sí, eliminar ${selectedCount}` : bulkAction === 'activate' ? `Sí, activar ${selectedCount}` : `Sí, ocultar ${selectedCount}`
        }
        cancelLabel="Cancelar"
        tone={bulkAction === 'delete' ? 'danger' : 'default'}
        loading={bulkBusy}
        onConfirm={() => bulkAction && runBulk(bulkAction)}
        onCancel={() => (bulkBusy ? null : setBulkAction(null))}
      />
    </>
  );
}
