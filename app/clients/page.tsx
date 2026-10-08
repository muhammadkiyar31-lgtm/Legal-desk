"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Edit3,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

type Client = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  idNumber: string;
  notes: string;
  createdAt: string;
};

const emptyForm = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  idNumber: "",
  notes: "",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] =
    useState<Client | null>(null);

  const [form, setForm] = useState(emptyForm);

  async function loadClients() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/clients", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load clients."
        );
      }

      setClients(data.clients || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load clients."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return clients;
    }

    return clients.filter(
      (client) =>
        client.fullName.toLowerCase().includes(query) ||
        client.phone.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.idNumber.toLowerCase().includes(query)
    );
  }, [clients, searchTerm]);

  function openCreateModal() {
    setEditingClient(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(client: Client) {
    setEditingClient(client);

    setForm({
      fullName: client.fullName,
      phone: client.phone,
      email: client.email,
      address: client.address,
      idNumber: client.idNumber,
      notes: client.notes,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (!saving) {
      setShowModal(false);
      setEditingClient(null);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const url = editingClient
        ? `/api/clients/${editingClient.id}`
        : "/api/clients";

      const method = editingClient ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
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
              editingClient ? "update" : "create"
            } client.`
        );
      }

      if (editingClient) {
        setClients((current) =>
          current.map((client) =>
            client.id === editingClient.id
              ? data.client
              : client
          )
        );

        setSuccess("Client updated successfully.");
      } else {
        setClients((current) => [
          data.client,
          ...current,
        ]);

        setSuccess("Client created successfully.");
      }

      setShowModal(false);
      setEditingClient(null);
      setForm(emptyForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Operation failed."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteClient(client: Client) {
    const confirmed = window.confirm(
      `Delete ${client.fullName}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/clients/${client.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete client."
        );
      }

      setClients((current) =>
        current.filter((item) => item.id !== client.id)
      );

      setSuccess("Client deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete client."
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <h1 className="text-2xl font-bold text-slate-950">
                Clients
              </h1>
              <p className="text-sm text-slate-500">
                Manage your legal clients.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus size={18} />
            New Client
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search clients by name, phone, email or ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <UserRound size={20} />
              <h2 className="font-semibold">
                Client List
              </h2>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {filteredClients.length}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-56 items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2
                  size={20}
                  className="animate-spin"
                />
                Loading clients...
              </div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <UserRound
                size={40}
                className="mb-3 text-slate-300"
              />

              <h3 className="font-semibold">
                {clients.length === 0
                  ? "No clients yet"
                  : "No matching clients"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {clients.length === 0
                  ? "Create your first client to get started."
                  : "Try a different search term."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Client
                    </th>
                    <th className="px-5 py-4">
                      Phone
                    </th>
                    <th className="px-5 py-4">
                      Email
                    </th>
                    <th className="px-5 py-4">
                      ID Number
                    </th>
                    <th className="px-5 py-4">
                      Created
                    </th>
                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {client.fullName}
                        </div>

                        {client.address && (
                          <div className="mt-1 max-w-xs truncate text-xs text-slate-500">
                            {client.address}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {client.phone || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {client.email || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {client.idNumber || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {new Date(
                          client.createdAt
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(client)
                            }
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                            aria-label={`Edit ${client.fullName}`}
                          >
                            <Edit3 size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteClient(client)
                            }
                            className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                            aria-label={`Delete ${client.fullName}`}
                          >
                            <Trash2 size={17} />
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-6">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="font-semibold text-slate-950">
                  {editingClient
                    ? "Edit Client"
                    : "New Client"}
                </h2>

                <p className="text-sm text-slate-500">
                  {editingClient
                    ? "Update client information."
                    : "Add a new legal client."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Full Name *
                  </label>

                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        fullName: event.target.value,
                      })
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    placeholder="Client full name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Phone
                  </label>

                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        phone: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    placeholder="+251..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Email
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        email: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    placeholder="client@example.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    ID Number
                  </label>

                  <input
                    type="text"
                    value={form.idNumber}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        idNumber: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    placeholder="Identification number"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Address
                  </label>

                  <input
                    type="text"
                    value={form.address}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        address: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    placeholder="Client address"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Notes
                  </label>

                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        notes: event.target.value,
                      })
                    }
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : editingClient
                      ? "Update Client"
                      : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}