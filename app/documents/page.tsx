"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Edit3,
  FileText,
  Printer,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

type CaseItem = {
  id: string;
  clientId: string;
  clientName: string;
  caseNumber: string;
  title: string;
  category: string;
  status: string;
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

type DocumentItem = {
  id: string;
  caseId: string;
  title: string;
  lawyerName: string;
  notes: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  caseNumber: string;
  caseTitle: string;
  clientName: string;
};

type DocumentForm = {
  caseId: string;
  title: string;
  lawyerName: string;
  notes: string;
  content: string;
};

const emptyForm: DocumentForm = {
  caseId: "",
  title: "",
  lawyerName: "Demo Lawyer",
  notes: "",
  content: "",
};

export default function DocumentsPage() {
  const router = useRouter();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [caseArticles, setCaseArticles] = useState<Article[]>([]);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [editingDocument, setEditingDocument] =
    useState<DocumentItem | null>(null);

  const [previewDocument, setPreviewDocument] =
    useState<DocumentItem | null>(null);

  const [form, setForm] = useState<DocumentForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [articlesLoading, setArticlesLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadDocuments() {
    const response = await fetch("/api/documents", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to load documents."
      );
    }

    setDocuments(data.documents || []);
  }

  async function loadCases() {
    const response = await fetch("/api/cases", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to load cases."
      );
    }

    setCases(data.cases || []);
  }

  async function loadArticles() {
    const response = await fetch("/api/articles", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to load legal articles."
      );
    }

    setArticles(data.articles || []);
  }

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadDocuments(),
        loadCases(),
        loadArticles(),
      ]);
    } catch (error) {
      console.error("Load documents page error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load documents."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function loadCaseArticles(caseId: string) {
    if (!caseId) {
      setCaseArticles([]);
      return;
    }

    try {
      setArticlesLoading(true);

      const response = await fetch(
        `/api/cases/${caseId}/articles`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load case legal articles."
        );
      }

      setCaseArticles(data.articles || []);
    } catch (error) {
      console.error("Load case articles error:", error);

      setCaseArticles([]);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load case legal articles."
      );
    } finally {
      setArticlesLoading(false);
    }
  }

  function generateContent(
    selectedCase: CaseItem | undefined,
    selectedArticles: Article[]
  ) {
    if (!selectedCase) {
      return "";
    }

    const articleSection =
      selectedArticles.length > 0
        ? selectedArticles
            .map(
              (article, index) =>
                `${index + 1}. Article ${article.articleNumber} — ${article.title}
Law: ${article.lawName}
${
  article.jurisdiction
    ? `Jurisdiction: ${article.jurisdiction}\n`
    : ""
}
${article.content}`
            )
            .join("\n\n")
        : "No legal articles have been selected for this case.";

    return `LEGAL DOCUMENT

CASE INFORMATION
----------------
Case Number: ${selectedCase.caseNumber}
Case Title: ${selectedCase.title}
Client: ${selectedCase.clientName}
Category: ${selectedCase.category || "N/A"}
Status: ${selectedCase.status}

APPLICABLE LEGAL ARTICLES
-------------------------
${articleSection}

LEGAL ANALYSIS / DOCUMENT BODY
------------------------------
Enter the legal analysis, arguments, requests, findings, or other
document-specific content here.

CONCLUSION
----------
Enter the conclusion or requested legal action here.

Prepared by: ${form.lawyerName || "Lawyer"}
`;
  }

  async function handleCaseChange(caseId: string) {
    setForm((current) => ({
      ...current,
      caseId,
    }));

    setCaseArticles([]);

    if (!caseId) {
      return;
    }

    try {
      setArticlesLoading(true);

      const response = await fetch(
        `/api/cases/${caseId}/articles`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load case legal articles."
        );
      }

      const selectedArticles: Article[] =
        data.articles || [];

      setCaseArticles(selectedArticles);

      const selectedCase = cases.find(
        (item) => item.id === caseId
      );

      if (!editingDocument && selectedCase) {
        setForm((current) => ({
          ...current,
          content: generateContent(
            selectedCase,
            selectedArticles
          ),
        }));
      }
    } catch (error) {
      console.error("Case article load error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load case articles."
      );
    } finally {
      setArticlesLoading(false);
    }
  }

  function openCreateModal() {
    setEditingDocument(null);
    setForm({
      ...emptyForm,
      lawyerName: "Demo Lawyer",
    });
    setCaseArticles([]);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  async function openEditModal(document: DocumentItem) {
    setEditingDocument(document);

    setForm({
      caseId: document.caseId,
      title: document.title,
      lawyerName: document.lawyerName,
      notes: document.notes || "",
      content: document.content || "",
    });

    setError("");
    setSuccess("");
    setModalOpen(true);

    await loadCaseArticles(document.caseId);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingDocument(null);
    setForm(emptyForm);
    setCaseArticles([]);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!form.caseId) {
        throw new Error("Please select a case.");
      }

      if (!form.title.trim()) {
        throw new Error("Document title is required.");
      }

      if (!form.lawyerName.trim()) {
        throw new Error("Lawyer name is required.");
      }

      const payload = {
        caseId: form.caseId,
        title: form.title.trim(),
        lawyerName: form.lawyerName.trim(),
        notes: form.notes.trim(),
        content: form.content,
      };

      let response: Response;

      if (editingDocument) {
        response = await fetch(
          `/api/documents/${editingDocument.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      } else {
        response = await fetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save document."
        );
      }

      await loadDocuments();

      setSuccess(
        editingDocument
          ? "Document updated successfully."
          : "Document created successfully."
      );

      setTimeout(() => {
        closeModal();
        setSuccess("");
      }, 700);
    } catch (error) {
      console.error("Save document error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save document."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(document: DocumentItem) {
    const confirmed = window.confirm(
      `Delete "${document.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(document.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/documents/${document.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete document."
        );
      }

      setDocuments((current) =>
        current.filter(
          (item) => item.id !== document.id
        )
      );

      setSuccess("Document deleted successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (error) {
      console.error("Delete document error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete document."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function openPreview(document: DocumentItem) {
    setPreviewDocument(document);
    setPreviewOpen(true);
  }

  function closePreview() {
    setPreviewOpen(false);
    setPreviewDocument(null);
  }

  function printDocument() {
    window.print();
  }

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return documents;
    }

    return documents.filter((document) =>
      [
        document.title,
        document.caseNumber,
        document.caseTitle,
        document.clientName,
        document.lawyerName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [documents, search]);

  const totalDocuments = documents.length;

  const currentYearDocuments = documents.filter((document) => {
    const date = new Date(document.createdAt);

    return date.getFullYear() === new Date().getFullYear();
  }).length;

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
                <FileText
                  size={22}
                  className="text-blue-400"
                />

                <h1 className="text-2xl font-bold">
                  Documents
                </h1>
              </div>

              <p className="mt-1 text-sm text-slate-400">
                Create, manage, print, and save legal documents.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <Plus size={18} />
            New Document
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

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total Documents
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalDocuments}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Created This Year
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-400">
              {currentYearDocuments}
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
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search documents, cases, clients..."
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
                  Loading documents...
                </p>
              </div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <FileText
                size={40}
                className="mb-4 text-slate-600"
              />

              <h2 className="text-lg font-semibold">
                No documents found
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Try a different search term."
                  : "Create your first legal document."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Document
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Case
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Client
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Lawyer
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {filteredDocuments.map((document) => (
                    <tr
                      key={document.id}
                      className="transition hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">
                          {document.title}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {new Date(
                            document.createdAt
                          ).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-blue-400">
                          {document.caseNumber}
                        </div>

                        <div className="mt-1 text-sm text-slate-400">
                          {document.caseTitle}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-300">
                        {document.clientName}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {document.lawyerName}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openPreview(document)
                            }
                            className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2 text-blue-400 transition hover:bg-blue-500/20"
                            title="Preview"
                          >
                            <FileText size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(document)
                            }
                            className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 transition hover:bg-slate-700 hover:text-white"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(document)
                            }
                            disabled={
                              deletingId === document.id
                            }
                            className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                            title="Delete"
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
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingDocument
                    ? "Edit Document"
                    : "Create Legal Document"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Generate a document from a case and its selected
                  legal articles.
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
                    Case
                  </label>

                  <select
                    value={form.caseId}
                    onChange={(event) =>
                      handleCaseChange(event.target.value)
                    }
                    className="input"
                    required
                  >
                    <option value="">
                      Select case
                    </option>

                    {cases.map((caseItem) => (
                      <option
                        key={caseItem.id}
                        value={caseItem.id}
                      >
                        {caseItem.caseNumber} —{" "}
                        {caseItem.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Document Title
                  </label>

                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="e.g. Legal Opinion"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Lawyer Name
                  </label>

                  <input
                    value={form.lawyerName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lawyerName: event.target.value,
                      }))
                    }
                    placeholder="Lawyer name"
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Applicable Legal Articles
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Articles already assigned to this case.
                    </p>
                  </div>

                  {articlesLoading && (
                    <span className="text-xs text-blue-400">
                      Loading...
                    </span>
                  )}
                </div>

                {caseArticles.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No legal articles are assigned to this case.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {caseArticles.map((article) => (
                      <div
                        key={article.id}
                        className="rounded-xl border border-slate-800 bg-slate-900 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-blue-400">
                            Article {article.articleNumber}
                          </span>

                          <span className="text-xs text-slate-500">
                            {article.lawName}
                          </span>
                        </div>

                        <p className="mt-1 text-sm font-medium text-white">
                          {article.title}
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-400">
                          {article.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Document Content
                </label>

                <textarea
                  value={form.content}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                  placeholder="Legal document content..."
                  className="input min-h-[360px] resize-y font-mono text-sm leading-6"
                />

                <p className="mt-2 text-xs text-slate-500">
                  You can edit the generated content before saving.
                </p>
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
                    : editingDocument
                    ? "Update Document"
                    : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewOpen && previewDocument && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/80 p-4 sm:p-8">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white text-black shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 print:hidden">
              <div>
                <h2 className="font-semibold">
                  Document Preview
                </h2>

                <p className="text-xs text-slate-500">
                  Ready to print or save as PDF.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={printDocument}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  <Printer size={16} />
                  Print / Save PDF
                </button>

                <button
                  type="button"
                  onClick={closePreview}
                  className="rounded-lg bg-slate-200 p-2 text-slate-700 hover:bg-slate-300"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <article className="min-h-[900px] px-10 py-12 sm:px-16">
              <div className="mb-10 text-center">
                <h1 className="text-2xl font-bold uppercase">
                  {previewDocument.title}
                </h1>

                <div className="mt-4 text-sm text-slate-600">
                  Legal Desk
                </div>
              </div>

              <div className="mb-8 grid gap-2 border-b border-slate-300 pb-6 text-sm sm:grid-cols-2">
                <div>
                  <strong>Case Number:</strong>{" "}
                  {previewDocument.caseNumber}
                </div>

                <div>
                  <strong>Client:</strong>{" "}
                  {previewDocument.clientName}
                </div>

                <div>
                  <strong>Case:</strong>{" "}
                  {previewDocument.caseTitle}
                </div>

                <div>
                  <strong>Lawyer:</strong>{" "}
                  {previewDocument.lawyerName}
                </div>
              </div>

              <div className="whitespace-pre-wrap text-sm leading-8">
                {previewDocument.content ||
                  "No document content."}
              </div>

              {previewDocument.notes && (
                <div className="mt-10 border-t border-slate-300 pt-6">
                  <h3 className="mb-2 font-semibold">
                    Notes
                  </h3>

                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                    {previewDocument.notes}
                  </p>
                </div>
              )}

              <div className="mt-16 border-t border-slate-300 pt-6 text-sm">
                <div className="flex justify-between">
                  <span>
                    Prepared by:{" "}
                    {previewDocument.lawyerName}
                  </span>

                  <span>
                    Date:{" "}
                    {new Date(
                      previewDocument.createdAt
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </article>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          .fixed.z-\\[60px\\],
          .fixed.z-\\[60px\\] * {
            visibility: visible;
          }

          .fixed.z-\\[60px\\] {
            position: absolute !important;
            inset: 0 !important;
            background: white !important;
            padding: 0 !important;
          }

          .fixed.z-\\[60px\\] > div {
            max-width: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          @page {
            margin: 20mm;
          }
        }
      `}</style>
    </main>
  );
}