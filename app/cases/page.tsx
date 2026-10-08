"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Edit3,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

type Client = {
  id: string;
  fullName: string;
};

type Article = {
  id: string;
  articleNumber: string;
  title: string;
  lawName: string;
  jurisdiction?: string;
  content: string;
  description?: string;
};

type CaseItem = {
  id: string;
  clientId: string;
  clientName: string;
  caseNumber: string;
  title: string;
  category: string;
  description: string;
  status: string;
  notes: string;
  createdAt?: string;
};

type CaseForm = {
  clientId: string;
  caseNumber: string;
  title: string;
  category: string;
  description: string;
  status: string;
  notes: string;
};

const emptyForm: CaseForm = {
  clientId: "",
  caseNumber: "",
  title: "",
  category: "",
  description: "",
  status: "Active",
  notes: "",
};

export default function CasesPage() {
  const router = useRouter();

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseItem | null>(null);

  const [form, setForm] = useState<CaseForm>(emptyForm);
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCases() {
    try {
      const response = await fetch("/api/cases", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load cases.");
      }

      setCases(data.cases || []);
    } catch (error) {
      console.error("Load cases error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load cases."
      );
    }
  }

  async function loadClients() {
    try {
      const response = await fetch("/api/clients", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load clients.");
      }

      setClients(data.clients || []);
    } catch (error) {
      console.error("Load clients error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load clients."
      );
    }
  }

  async function loadArticles() {
    try {
      setArticlesLoading(true);

      const response = await fetch("/api/articles", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load legal articles.");
      }

      setArticles(data.articles || []);
    } catch (error) {
      console.error("Load articles error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load legal articles."
      );
    } finally {
      setArticlesLoading(false);
    }
  }

  async function loadCaseArticles(caseId: string) {
    try {
      const response = await fetch(`/api/cases/${caseId}/articles`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load case legal articles."
        );
      }

      setSelectedArticleIds(
        (data.articles || []).map((article: Article) => article.id)
      );
    } catch (error) {
      console.error("Load case articles error:", error);
      setSelectedArticleIds([]);
    }
  }

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadCases(),
        loadClients(),
        loadArticles(),
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openCreateModal() {
    setEditingCase(null);
    setForm(emptyForm);
    setSelectedArticleIds([]);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  async function openEditModal(caseItem: CaseItem) {
    setEditingCase(caseItem);

    setForm({
      clientId: caseItem.clientId,
      caseNumber: caseItem.caseNumber,
      title: caseItem.title,
      category: caseItem.category || "",
      description: caseItem.description || "",
      status: caseItem.status || "Active",
      notes: caseItem.notes || "",
    });

    setSelectedArticleIds([]);
    setError("");
    setSuccess("");
    setModalOpen(true);

    await loadCaseArticles(caseItem.id);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingCase(null);
    setForm(emptyForm);
    setSelectedArticleIds([]);
  }

  function toggleArticle(articleId: string) {
    setSelectedArticleIds((current) =>
      current.includes(articleId)
        ? current.filter((id) => id !== articleId)
        : [...current, articleId]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!form.clientId) {
        throw new Error("Please select a client.");
      }

      if (!form.caseNumber.trim()) {
        throw new Error("Case number is required.");
      }

      if (!form.title.trim()) {
        throw new Error("Case title is required.");
      }

      const payload = {
        clientId: form.clientId,
        caseNumber: form.caseNumber.trim(),
        title: form.title.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        status: form.status,
        notes: form.notes.trim(),
      };

      let response: Response;
      let data: {
        message?: string;
        case?: CaseItem;
      };

      if (editingCase) {
        response = await fetch(`/api/cases/${editingCase.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/cases", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      data = await response.json();

      if (!response.ok || !data.case) {
        throw new Error(data.message || "Failed to save case.");
      }

      const savedCase = data.case;

      const articlesResponse = await fetch(
        `/api/cases/${savedCase.id}/articles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            articleIds: selectedArticleIds,
          }),
        }
      );

      const articlesData = await articlesResponse.json();

      if (!articlesResponse.ok) {
        throw new Error(
          articlesData.message || "Failed to save case legal articles."
        );
      }

      setSuccess(
        editingCase
          ? "Case updated successfully."
          : "Case created successfully."
      );

      await loadCases();

      setTimeout(() => {
        closeModal();
        setSuccess("");
      }, 700);
    } catch (error) {
      console.error("Save case error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to save case."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(caseItem: CaseItem) {
    const confirmed = window.confirm(
      `Delete case "${caseItem.caseNumber}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(caseItem.id);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/cases/${caseItem.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete case.");
      }

      setCases((current) =>
        current.filter((item) => item.id !== caseItem.id)
      );

      setSuccess("Case deleted successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (error) {
      console.error("Delete case error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to delete case."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredCases = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return cases;

    return cases.filter((item) =>
      [
        item.caseNumber,
        item.title,
        item.clientName,
        item.category,
        item.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [cases, search]);

  const activeCases = cases.filter(
    (item) => item.status === "Active"
  ).length;

  const closedCases = cases.filter(
    (item) => item.status === "Closed"
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <BriefcaseBusiness
                  size={22}
                  className="text-blue-400"
                />
                <h1 className="text-2xl font-bold">Cases</h1>
              </div>

              <p className="mt-1 text-sm text-slate-400">
                Manage client cases and their legal articles.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <Plus size={18} />
            New Case
          </button>
        </div>

        {(error || success) && (
          <div className="mb-5">
            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={18} />
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="ml-auto"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                <CheckCircle2 size={18} />
                <span>{success}</span>
              </div>
            )}
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total Cases</p>
            <p className="mt-2 text-3xl font-bold">
              {cases.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Active Cases</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {activeCases}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Closed Cases</p>
            <p className="mt-2 text-3xl font-bold text-slate-300">
              {closedCases}
            </p>
          </div>
        </div>

        <div className="mb-5">
          <div className="relative max-w-xl">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search cases, clients, case numbers..."
              className="input pl-10"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
                <p className="text-sm text-slate-400">
                  Loading cases...
                </p>
              </div>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <FolderOpen
                size={40}
                className="mb-4 text-slate-600"
              />

              <h2 className="text-lg font-semibold">
                No cases found
              </h2>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                {search
                  ? "Try a different search term."
                  : "Create your first case to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Case
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Client
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Category
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {filteredCases.map((caseItem) => (
                    <tr
                      key={caseItem.id}
                      className="transition hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">
                          {caseItem.caseNumber}
                        </div>

                        <div className="mt-1 text-sm text-slate-400">
                          {caseItem.title}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-300">
                        {caseItem.clientName}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {caseItem.category || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            caseItem.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : caseItem.status === "Closed"
                              ? "bg-slate-700 text-slate-300"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {caseItem.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(caseItem)
                            }
                            className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 transition hover:bg-slate-700 hover:text-white"
                            title="Edit case"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(caseItem)
                            }
                            disabled={
                              deletingId === caseItem.id
                            }
                            className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                            title="Delete case"
                          >
                            <Trash2 size={16} />
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
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingCase ? "Edit Case" : "Create New Case"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Case information and applicable legal articles.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Client
                  </label>

                  <select
                    value={form.clientId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        clientId: event.target.value,
                      }))
                    }
                    className="input"
                    required
                  >
                    <option value="">Select client</option>

                    {clients.map((client) => (
                      <option
                        key={client.id}
                        value={client.id}
                      >
                        {client.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Case Number
                  </label>

                  <input
                    value={form.caseNumber}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        caseNumber: event.target.value,
                      }))
                    }
                    placeholder="e.g. LD-2026-001"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Case Title
                  </label>

                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Enter case title"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Category
                  </label>

                  <input
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    placeholder="e.g. Criminal, Civil, Family"
                    className="input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                    className="input"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Describe the case..."
                  className="input min-h-28 resize-y"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Notes
                </label>

                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Internal notes..."
                  className="input min-h-24 resize-y"
                />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Legal Articles
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Select one or more legal articles applicable to
                      this case.
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                    {selectedArticleIds.length} selected
                  </span>
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-3">
                  {articlesLoading ? (
                    <div className="py-8 text-center text-sm text-slate-500">
                      Loading legal articles...
                    </div>
                  ) : articles.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-slate-400">
                        No legal articles available.
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Add legal articles from the Legal Articles
                        module first.
                      </p>
                    </div>
                  ) : (
                    articles.map((article) => {
                      const selected =
                        selectedArticleIds.includes(article.id);

                      return (
                        <button
                          key={article.id}
                          type="button"
                          onClick={() =>
                            toggleArticle(article.id)
                          }
                          className={`w-full rounded-xl border p-3 text-left transition ${
                            selected
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-slate-800 bg-slate-900 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                                selected
                                  ? "border-blue-500 bg-blue-500 text-white"
                                  : "border-slate-600 bg-slate-950 text-transparent"
                              }`}
                            >
                              ✓
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-blue-400">
                                  Article{" "}
                                  {article.articleNumber}
                                </span>

                                <span className="text-xs text-slate-500">
                                  {article.lawName}
                                </span>
                              </div>

                              <p className="mt-1 text-sm text-white">
                                {article.title}
                              </p>

                              {article.jurisdiction && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {article.jurisdiction}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <p className="mt-2 text-xs text-amber-400/80">
                  Verify all legal article numbers and wording against
                  the applicable official law before using them in a
                  legal document.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  <AlertCircle size={17} />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  <CheckCircle2 size={17} />
                  {success}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingCase
                    ? "Update Case"
                    : "Create Case"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}