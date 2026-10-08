"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

type Article = {
  id: string;
  articleNumber: string;
  title: string;
  lawName: string;
  jurisdiction: string;
  content: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type ArticleForm = {
  articleNumber: string;
  title: string;
  lawName: string;
  jurisdiction: string;
  content: string;
  description: string;
};

const emptyForm: ArticleForm = {
  articleNumber: "",
  title: "",
  lawName: "",
  jurisdiction: "",
  content: "",
  description: "",
};

export default function ArticlesPage() {
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] =
    useState<Article | null>(null);

  const [form, setForm] = useState<ArticleForm>(emptyForm);

  async function loadArticles() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/articles");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load legal articles."
        );
      }

      setArticles(data.articles || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load legal articles."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArticles();
  }, []);

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return articles;

    return articles.filter((article) =>
      [
        article.articleNumber,
        article.title,
        article.lawName,
        article.jurisdiction,
        article.description,
        article.content,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [articles, search]);

  function openCreateModal() {
    setEditingArticle(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(article: Article) {
    setEditingArticle(article);

    setForm({
      articleNumber: article.articleNumber,
      title: article.title,
      lawName: article.lawName,
      jurisdiction: article.jurisdiction || "",
      content: article.content,
      description: article.description || "",
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingArticle(null);
    setForm(emptyForm);
  }

  function updateForm(
    field: keyof ArticleForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !form.articleNumber.trim() ||
      !form.title.trim() ||
      !form.lawName.trim() ||
      !form.content.trim()
    ) {
      setError(
        "Article number, title, law name and content are required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const url = editingArticle
        ? `/api/articles/${editingArticle.id}`
        : "/api/articles";

      const response = await fetch(url, {
        method: editingArticle ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${
              editingArticle ? "update" : "create"
            } article.`
        );
      }

      if (editingArticle) {
        setArticles((current) =>
          current.map((item) =>
            item.id === editingArticle.id
              ? data.article
              : item
          )
        );

        setSuccess("Legal article updated successfully.");
      } else {
        setArticles((current) => [
          data.article,
          ...current,
        ]);

        setSuccess("Legal article created successfully.");
      }

      setTimeout(() => {
        setModalOpen(false);
        setEditingArticle(null);
        setForm(emptyForm);
        setSuccess("");
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(article: Article) {
    const confirmed = window.confirm(
      `Delete Article ${article.articleNumber}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/articles/${article.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete article."
        );
      }

      setArticles((current) =>
        current.filter(
          (item) => item.id !== article.id
        )
      );

      setSuccess("Legal article deleted successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete article."
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
              <BookOpen className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Legal Articles
              </h1>

              <p className="text-sm text-slate-400">
                Manage legal provisions and articles.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            New Article
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Total Articles"
            value={articles.length}
          />

          <StatCard
            label="Legal Acts"
            value={
              new Set(
                articles.map((article) => article.lawName)
              ).size
            }
          />
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search articles, laws, titles..."
              className="input pl-10"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
          {loading ? (
            <div className="flex min-h-60 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

                <p className="text-sm text-slate-400">
                  Loading legal articles...
                </p>
              </div>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 rounded-2xl bg-slate-800 p-4">
                <BookOpen className="h-8 w-8 text-slate-500" />
              </div>

              <h3 className="text-lg font-semibold">
                No legal articles found
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                {search
                  ? "Try changing your search."
                  : "Add your first legal article."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Article
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Title
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Law
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Jurisdiction
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {filteredArticles.map((article) => (
                    <tr
                      key={article.id}
                      className="transition hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-400">
                          {article.articleNumber}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-xs">
                          <p className="font-semibold text-white">
                            {article.title}
                          </p>

                          {article.description && (
                            <p className="mt-1 truncate text-sm text-slate-400">
                              {article.description}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-300">
                        {article.lawName}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {article.jurisdiction || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(article)
                            }
                            className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                            title="Edit article"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(article)
                            }
                            className="rounded-lg border border-red-500/20 p-2 text-red-400 transition hover:bg-red-500/10"
                            title="Delete article"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold">
                  {editingArticle
                    ? "Edit Legal Article"
                    : "New Legal Article"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Add the legal provision details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Article Number *">
                  <input
                    value={form.articleNumber}
                    onChange={(event) =>
                      updateForm(
                        "articleNumber",
                        event.target.value
                      )
                    }
                    className="input"
                    placeholder="Article 101"
                    required
                  />
                </Field>

                <Field label="Law Name *">
                  <input
                    value={form.lawName}
                    onChange={(event) =>
                      updateForm(
                        "lawName",
                        event.target.value
                      )
                    }
                    className="input"
                    placeholder="Civil Code"
                    required
                  />
                </Field>
              </div>

              <Field label="Title *">
                <input
                  value={form.title}
                  onChange={(event) =>
                    updateForm(
                      "title",
                      event.target.value
                    )
                  }
                  className="input"
                  placeholder="Article title"
                  required
                />
              </Field>

              <Field label="Jurisdiction">
                <input
                  value={form.jurisdiction}
                  onChange={(event) =>
                    updateForm(
                      "jurisdiction",
                      event.target.value
                    )
                  }
                  className="input"
                  placeholder="Federal / Regional / Country"
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  className="input min-h-24 resize-y"
                  placeholder="Short description..."
                />
              </Field>

              <Field label="Article Content *">
                <textarea
                  value={form.content}
                  onChange={(event) =>
                    updateForm(
                      "content",
                      event.target.value
                    )
                  }
                  className="input min-h-48 resize-y"
                  placeholder="Enter the legal article content..."
                  required
                />
              </Field>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300">
                Legal article content should be verified by a qualified lawyer against the applicable official law and jurisdiction.
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingArticle
                    ? "Update Article"
                    : "Create Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      {children}
    </label>
  );
}