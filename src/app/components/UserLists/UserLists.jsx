'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { MdAdd, MdDelete, MdEdit, MdLock, MdPublic } from 'react-icons/md';
import { showToast } from '@/app/components/ui/toast';

const PROJECT_ICON = '/img/logo.png';

function safePoster(movie) {
  if (!movie?.posterUrl && !movie?.posterPath) return PROJECT_ICON;
  const value = movie.posterUrl || movie.posterPath;
  return value.startsWith('http') ? value : `https://image.tmdb.org/t/p/w500${value}`;
}

function formatDate(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return '';
  }
}

function initialFormState() {
  return {
    id: null,
    title: '',
    description: '',
    isPublic: false,
  };
}

export default function UserLists({ id, onCountChange }) {
  const { data: session, status } = useSession();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialFormState);

  const isOwnProfile = useMemo(() => {
    if (status === 'loading') return false;
    return session?.user?.id === id;
  }, [id, session?.user?.id, status]);

  const loadLists = useCallback(async () => {
    if (status === 'loading') return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = isOwnProfile
        ? '/api/lists/my'
        : `/api/lists/public?userId=${encodeURIComponent(id)}`;
      const response = await fetch(endpoint, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load lists');
      }

      const nextLists = Array.isArray(payload?.lists) ? payload.lists : [];
      setLists(nextLists);
      onCountChange?.(nextLists.length);
    } catch (err) {
      console.error('Error loading lists:', err);
      setError(err.message || 'Failed to load lists');
    } finally {
      setLoading(false);
    }
  }, [id, isOwnProfile, onCountChange, status]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  const openCreate = () => {
    setForm(initialFormState());
    setEditorOpen(true);
  };

  const openEdit = (list) => {
    setForm({
      id: list.id,
      title: list.title || '',
      description: list.description || '',
      isPublic: !!list.isPublic,
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
    setForm(initialFormState());
  };

  const saveList = async () => {
    const title = form.title.trim();
    if (title.length < 2) {
      showToast('List title must be at least 2 characters.', 1600);
      return;
    }

    setSaving(true);

    try {
      const isEditing = !!form.id;
      const response = await fetch(
        isEditing ? `/api/lists/${form.id}` : '/api/lists',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description: form.description.trim() || null,
            isPublic: form.isPublic,
          }),
        }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to save list');
      }

      showToast(isEditing ? 'List updated' : 'List created');
      setEditorOpen(false);
      setForm(initialFormState());
      await loadLists();
    } catch (err) {
      console.error('Error saving list:', err);
      showToast(err.message || 'Failed to save list', 1700);
    } finally {
      setSaving(false);
    }
  };

  const deleteList = async (list) => {
    if (!window.confirm(`Delete "${list.title}"?`)) return;

    try {
      const response = await fetch(`/api/lists/${list.id}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete list');
      }

      setLists((prev) => {
        const next = prev.filter((item) => item.id !== list.id);
        onCountChange?.(next.length);
        return next;
      });
      showToast('List deleted');
    } catch (err) {
      console.error('Error deleting list:', err);
      showToast(err.message || 'Failed to delete list', 1700);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-gray-700/30 border border-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isOwnProfile ? 'Your Movie Lists' : 'Public Movie Lists'}
            </h1>
            <p className="mt-2 text-sm text-gray-300">
              {isOwnProfile
                ? 'Create private or public collections for the movies you want to group together.'
                : 'Browse the lists this user has chosen to share publicly.'}
            </p>
          </div>

          {isOwnProfile ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              <MdAdd size={18} />
              Create List
            </button>
          ) : null}
        </div>

        {lists.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center">
            <p className="text-gray-300 text-lg">
              {isOwnProfile ? 'No lists yet' : 'No public lists yet'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {isOwnProfile
                ? 'Create a list from here or while saving a movie.'
                : 'Check back later for shared collections.'}
            </p>
            {isOwnProfile ? (
              <button
                type="button"
                onClick={openCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100"
              >
                <MdAdd size={18} />
                New List
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {lists.map((list) => {
              const previewMovies = Array.isArray(list.movies) ? list.movies.slice(0, 4) : [];

              return (
                <div
                  key={list.id}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-3 shadow-xl"
                >
                  <Link href={`/watchlists/${list.id}`} className="block group">
                    <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-yellow-600/20 via-orange-500/10 to-black/40">
                      {previewMovies.length > 0 ? (
                        <div className="grid h-full w-full grid-cols-2">
                          {previewMovies.map((movie, index) => (
                            <div
                              key={`${list.id}-${movie.movieId || index}`}
                              className="relative overflow-hidden border border-black/10"
                            >
                              <Image
                                src={safePoster(movie)}
                                alt={movie.title || 'Movie poster'}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                unoptimized
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Image
                            src={PROJECT_ICON}
                            alt="TheMovieProject"
                            width={72}
                            height={72}
                            className="h-16 w-16 object-contain opacity-90"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 px-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-lg font-semibold text-white">
                          {list.title}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                            list.isPublic
                              ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
                              : 'border-white/15 bg-white/5 text-white/75'
                          }`}
                        >
                          {list.isPublic ? <MdPublic size={14} /> : <MdLock size={14} />}
                          {list.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>

                      {list.description ? (
                        <p className="line-clamp-3 text-sm text-gray-300">
                          {list.description}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">
                          {list.isPublic
                            ? 'Publicly shared movie picks.'
                            : 'Visible only to you.'}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>
                          {list.movieCount || 0} {(list.movieCount || 0) === 1 ? 'movie' : 'movies'}
                        </span>
                        <span>Updated {formatDate(list.updatedAt)}</span>
                      </div>
                    </div>
                  </Link>

                  {isOwnProfile ? (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(list)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                      >
                        <MdEdit size={16} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteList(list)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:bg-red-500/20"
                      >
                        <MdDelete size={16} />
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#111] p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {form.id ? 'Edit List' : 'Create List'}
                </h2>
                <p className="mt-1 text-sm text-white/60">
                  Choose who can see this list on your profile.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full border border-white/15 px-3 py-1 text-sm text-white/70 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/50">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Favorite Thrillers"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-white placeholder:text-white/35 outline-none focus:border-white/35"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/50">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="A list for moody, edge-of-your-seat favorites."
                  rows={4}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-white placeholder:text-white/35 outline-none focus:border-white/35"
                />
              </div>

              <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  Visibility
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, isPublic: false }))}
                    className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                      !form.isPublic
                        ? 'border-white bg-white text-black'
                        : 'border-white/15 bg-transparent text-white/75 hover:bg-white/10'
                    }`}
                  >
                    Private
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, isPublic: true }))}
                    className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                      form.isPublic
                        ? 'border-white bg-white text-black'
                        : 'border-white/15 bg-transparent text-white/75 hover:bg-white/10'
                    }`}
                  >
                    Public
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveList}
                  disabled={saving}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create List'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
