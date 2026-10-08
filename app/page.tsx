"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Scale,
  Search,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
};

type CaseItem = {
  id: string;
  clientId?: string;
  clientName?: string;
  caseNumber: string;
  title: string;
  category?: string;
  status: string;
  createdAt?: string;
};

type LegalArticle = {
  id: string;
  articleNumber: string;
  title: string;
  lawName: string;
  jurisdiction?: string;
  content: string;
  description?: string;
};

type LegalDocument = {
  id: string;
  caseId: string;
  title: string;
  lawyerName: string;
  updatedAt: string;
};

type LawyerUser = {
  name: string;
  email: string;
  role: string;
};

type DashboardStats = {
  totalClients: number;
  activeCases: number;
  legalArticles: number;
  documents: number;
};

type DashboardResponse = {
  success: boolean;
  stats: DashboardStats;
  recentCases: CaseItem[];
};

type SessionResponse = {
  authenticated: boolean;
  user?: LawyerUser;
};

const navigation = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/clients",
    label: "Clients",
    icon: Users,
  },
  {
    href: "/cases",
    label: "Cases",
    icon: FolderOpen,
  },
  {
    href: "/articles",
    label: "Legal Articles",
    icon: Scale,
    permission: "articles",
  },
  {
    href: "/documents",
    label: "Documents",
    icon: FileText,
  },
  {
    href: "/users",
    label: "User Management",
    icon: Users,
    permission: "users",
  },
];

const defaultStats: DashboardStats = {
  totalClients: 0,
  activeCases: 0,
  legalArticles: 0,
  documents: 0,
};

const defaultLawyer: LawyerUser = {
  name: "Lawyer",
  email: "",
  role: "Lawyer",
};

function canAccess(
  role: string,
  permission?: string
) {
  if (!permission) {
    return true;
  }

  if (permission === "users") {
    return role === "Manager";
  }

  if (permission === "articles") {
    return (
      role === "Manager" ||
      role === "Lawyer"
    );
  }

  return false;
}

function getNavigationForRole(role: string) {
  return navigation.filter((item) =>
    canAccess(role, item.permission)
  );
}

export default function Home() {
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [userRole, setUserRole] =
    useState("");

  const [clients, setClients] =
    useState<Client[]>([]);

  const [cases, setCases] =
    useState<CaseItem[]>([]);

  const [articles, setArticles] =
    useState<LegalArticle[]>([]);

  const [documents, setDocuments] =
    useState<LegalDocument[]>([]);

  const [stats, setStats] =
    useState<DashboardStats>(defaultStats);

  const [recentCases, setRecentCases] =
    useState<CaseItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [lawyer, setLawyer] =
    useState<LawyerUser>(defaultLawyer);

  useEffect(() => {
    initializeDashboard();
  }, []);

  async function initializeDashboard() {
    const authenticated =
      await loadLawyer();

    if (!authenticated) {
      return;
    }

    await loadDashboard();
  }

  async function loadLawyer(): Promise<boolean> {
    try {
      const response = await fetch(
        "/api/auth/session",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        router.replace("/login");
        return false;
      }

      const data: SessionResponse =
        await response.json();

      if (
        !data.authenticated ||
        !data.user
      ) {
        router.replace("/login");
        return false;
      }

      const currentUser = {
        name: data.user.name || "Lawyer",
        email: data.user.email || "",
        role: data.user.role || "Lawyer",
      };

      setLawyer(currentUser);
      setUserRole(currentUser.role);

      return true;
    } catch (error) {
      console.error(
        "Session loading error:",
        error
      );

      router.replace("/login");
      return false;
    }
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const sessionResponse = await fetch(
        "/api/auth/session",
        {
          cache: "no-store",
        }
      );

      if (!sessionResponse.ok) {
        router.replace("/login");
        return;
      }

      const sessionData: SessionResponse =
        await sessionResponse.json();

      if (
        !sessionData.authenticated ||
        !sessionData.user
      ) {
        router.replace("/login");
        return;
      }

      const role =
        sessionData.user.role || "Lawyer";

      setUserRole(role);

      const requests: Promise<Response>[] = [
        fetch("/api/dashboard", {
          cache: "no-store",
        }),

        fetch("/api/clients", {
          cache: "no-store",
        }),

        fetch("/api/cases", {
          cache: "no-store",
        }),

        fetch("/api/documents", {
          cache: "no-store",
        }),
      ];

      const [
        dashboardResponse,
        clientsResponse,
        casesResponse,
        documentsResponse,
      ] = await Promise.all(requests);

      let articlesResponse:
        | Response
        | null = null;

      if (
        role === "Manager" ||
        role === "Lawyer"
      ) {
        articlesResponse = await fetch(
          "/api/articles",
          {
            cache: "no-store",
          }
        );
      }

      if (!dashboardResponse.ok) {
        throw new Error(
          "Failed to load dashboard."
        );
      }

      if (!clientsResponse.ok) {
        throw new Error(
          "Failed to load clients."
        );
      }

      if (!casesResponse.ok) {
        throw new Error(
          "Failed to load cases."
        );
      }

      if (!documentsResponse.ok) {
        throw new Error(
          "Failed to load documents."
        );
      }

      if (
        articlesResponse &&
        !articlesResponse.ok
      ) {
        throw new Error(
          "Failed to load legal articles."
        );
      }

      const dashboardData: DashboardResponse =
        await dashboardResponse.json();

      const clientsData =
        await clientsResponse.json();

      const casesData =
        await casesResponse.json();

      const documentsData =
        await documentsResponse.json();

      let articlesData: {
        articles?: LegalArticle[];
      } = {
        articles: [],
      };

      if (articlesResponse) {
        articlesData =
          await articlesResponse.json();
      }

      setStats(
        dashboardData.stats ||
          defaultStats
      );

      setRecentCases(
        dashboardData.recentCases || []
      );

      setClients(
        clientsData.clients || []
      );

      setCases(
        casesData.cases || []
      );

      setDocuments(
        documentsData.documents || []
      );

      setArticles(
        articlesData.articles || []
      );
    } catch (err) {
      console.error(
        "Dashboard loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    } finally {
      setMobileMenuOpen(false);
      router.replace("/login");
    }
  }

  const searchResults = useMemo(() => {
    const query =
      searchTerm.trim().toLowerCase();

    if (!query) {
      return {
        clients: [],
        cases: [],
        articles: [],
        documents: [],
      };
    }

    const canSeeArticles =
      userRole === "Manager" ||
      userRole === "Lawyer";

    return {
      clients: clients
        .filter(
          (client) =>
            client.fullName
              .toLowerCase()
              .includes(query) ||
            client.phone
              ?.toLowerCase()
              .includes(query) ||
            client.email
              ?.toLowerCase()
              .includes(query)
        )
        .slice(0, 5),

      cases: cases
        .filter(
          (item) =>
            item.caseNumber
              .toLowerCase()
              .includes(query) ||
            item.title
              .toLowerCase()
              .includes(query) ||
            item.category
              ?.toLowerCase()
              .includes(query) ||
            item.status
              .toLowerCase()
              .includes(query) ||
            item.clientName
              ?.toLowerCase()
              .includes(query)
        )
        .slice(0, 5),

      articles: canSeeArticles
        ? articles
            .filter(
              (article) =>
                article.articleNumber
                  .toLowerCase()
                  .includes(query) ||
                article.title
                  .toLowerCase()
                  .includes(query) ||
                article.lawName
                  .toLowerCase()
                  .includes(query) ||
                article.jurisdiction
                  ?.toLowerCase()
                  .includes(query) ||
                article.description
                  ?.toLowerCase()
                  .includes(query) ||
                article.content
                  .toLowerCase()
                  .includes(query)
            )
            .slice(0, 5)
        : [],

      documents: documents
        .filter(
          (document) =>
            document.title
              .toLowerCase()
              .includes(query) ||
            document.lawyerName
              .toLowerCase()
              .includes(query)
        )
        .slice(0, 5),
    };
  }, [
    searchTerm,
    clients,
    cases,
    articles,
    documents,
    userRole,
  ]);

  const totalSearchResults =
    searchResults.clients.length +
    searchResults.cases.length +
    searchResults.articles.length +
    searchResults.documents.length;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col bg-slate-950 text-white md:flex">
          <SidebarContent
            lawyer={lawyer}
            onLogout={handleLogout}
          />
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/50"
              onClick={() =>
                setMobileMenuOpen(false)
              }
            />

            <aside className="relative flex h-full w-72 max-w-[85%] flex-col bg-slate-950 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950">
                    <Scale size={22} />
                  </div>

                  <div>
                    <h1 className="text-lg font-bold">
                      Legal Desk
                    </h1>

                    <p className="text-xs text-slate-400">
                      Lawyer Management
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="rounded-lg p-2 text-slate-300 hover:bg-slate-900 hover:text-white"
                >
                  <X size={22} />
                </button>
              </div>

              <nav className="flex-1 space-y-2 p-4">
                {getNavigationForRole(
                  userRole
                ).map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() =>
                        setMobileMenuOpen(false)
                      }
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                        item.href === "/"
                          ? "bg-white text-slate-950"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      <Icon size={19} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-slate-800 p-4">
                <div className="rounded-xl bg-slate-900 p-4">
                  <p className="text-sm font-semibold">
                    {lawyer.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {lawyer.email}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {lawyer.role}
                  </p>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        <section className="flex-1">
          <header className="flex h-20 items-center justify-between border-b bg-white px-4 sm:px-5 md:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Open menu"
                onClick={() =>
                  setMobileMenuOpen(true)
                }
                className="rounded-xl border bg-white p-2.5 shadow-sm hover:bg-slate-50 md:hidden"
              >
                <Menu size={21} />
              </button>

              <div>
                <h2 className="text-xl font-bold">
                  Dashboard
                </h2>

                <p className="text-sm text-slate-500">
                  Welcome back, {lawyer.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">
                  {lawyer.name}
                </p>

                <p className="text-xs text-slate-500">
                  {lawyer.role}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSearchOpen(true)
                }
                className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 sm:px-4"
              >
                <Search size={18} />

                <span className="hidden sm:inline">
                  Search
                </span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="hidden items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 md:flex"
              >
                <LogOut size={18} />

                <span>Logout</span>
              </button>
            </div>
          </header>

          <div className="p-4 sm:p-5 md:p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-bold">
                Good evening, {lawyer.name}
              </h3>

              <p className="mt-1 text-slate-500">
                Manage your clients, cases and legal
                documents.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}

                <button
                  type="button"
                  onClick={loadDashboard}
                  className="ml-3 font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Clients"
                value={
                  loading
                    ? 0
                    : stats.totalClients
                }
                icon={<Users size={23} />}
              />

              <StatCard
                title="Active Cases"
                value={
                  loading
                    ? 0
                    : stats.activeCases
                }
                icon={
                  <BriefcaseBusiness size={23} />
                }
              />

              <StatCard
                title="Legal Articles"
                value={
                  loading
                    ? 0
                    : stats.legalArticles
                }
                icon={<Scale size={23} />}
              />

              <StatCard
                title="Documents"
                value={
                  loading
                    ? 0
                    : stats.documents
                }
                icon={<FileText size={23} />}
              />
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-3">
              <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">
                      Recent Cases
                    </h3>

                    <p className="text-sm text-slate-500">
                      Latest legal cases
                    </p>
                  </div>

                  <Link
                    href="/cases"
                    className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
                  >
                    View all
                  </Link>
                </div>

                {loading ? (
                  <div className="rounded-xl border border-dashed p-8 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

                    <p className="mt-3 text-sm text-slate-500">
                      Loading cases...
                    </p>
                  </div>
                ) : recentCases.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center">
                    <FolderOpen
                      className="mx-auto"
                      size={28}
                    />

                    <p className="mt-3 font-semibold">
                      No cases yet
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Create your first case to see it
                      here.
                    </p>

                    <Link
                      href="/cases"
                      className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white"
                    >
                      Create Case
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left text-sm">
                      <thead>
                        <tr className="border-b text-slate-500">
                          <th className="pb-3 font-medium">
                            Client
                          </th>

                          <th className="pb-3 font-medium">
                            Case
                          </th>

                          <th className="pb-3 font-medium">
                            Category
                          </th>

                          <th className="pb-3 font-medium">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {recentCases.map(
                          (item) => (
                            <tr
                              key={item.id}
                              className="border-b last:border-0"
                            >
                              <td className="py-4 font-medium">
                                {item.clientName ||
                                  "Unknown Client"}
                              </td>

                              <td className="py-4">
                                <div>
                                  <p className="font-medium">
                                    {item.title}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    {item.caseNumber}
                                  </p>
                                </div>
                              </td>

                              <td className="py-4 text-slate-500">
                                {item.category ||
                                  "N/A"}
                              </td>

                              <td className="py-4">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-lg font-bold">
                  Quick Actions
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Start a new legal workflow
                </p>

                <div className="mt-5 space-y-3">
                  <QuickAction
                    href="/clients"
                    icon={<Users size={19} />}
                    text="Create Client"
                  />

                  <QuickAction
                    href="/cases"
                    icon={<FolderOpen size={19} />}
                    text="Create Case"
                  />

                  {(userRole === "Manager" ||
                    userRole === "Lawyer") && (
                    <QuickAction
                      href="/articles"
                      icon={<Scale size={19} />}
                      text="Find Legal Article"
                    />
                  )}

                  <QuickAction
                    href="/documents"
                    icon={<FileText size={19} />}
                    text="Create Document"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 p-4 pt-20">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center gap-3 border-b p-4">
              <Search
                size={20}
                className="text-slate-400"
              />

              <input
                autoFocus
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search clients, cases, legal articles or documents..."
                className="flex-1 bg-transparent text-sm outline-none"
              />

              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchTerm("");
                }}
                className="rounded-lg p-2 hover:bg-slate-100"
                aria-label="Close search"
              >
                <X size={19} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-4">
              {!searchTerm.trim() ? (
                <div className="py-12 text-center">
                  <Search
                    className="mx-auto text-slate-300"
                    size={36}
                  />

                  <p className="mt-4 font-semibold">
                    Search Legal Desk
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Find clients, cases, articles and
                    documents.
                  </p>
                </div>
              ) : totalSearchResults === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-semibold">
                    No results found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Try a different name, case number or
                    article.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <SearchGroup
                    title="Clients"
                    count={
                      searchResults.clients.length
                    }
                    icon={<Users size={17} />}
                  >
                    {searchResults.clients.map(
                      (client) => (
                        <Link
                          key={client.id}
                          href="/clients"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchTerm("");
                          }}
                          className="block rounded-xl border p-4 hover:bg-slate-50"
                        >
                          <p className="font-semibold">
                            {client.fullName}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {client.phone ||
                              client.email ||
                              "Client"}
                          </p>
                        </Link>
                      )
                    )}
                  </SearchGroup>

                  <SearchGroup
                    title="Cases"
                    count={
                      searchResults.cases.length
                    }
                    icon={<FolderOpen size={17} />}
                  >
                    {searchResults.cases.map(
                      (item) => (
                        <Link
                          key={item.id}
                          href="/cases"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchTerm("");
                          }}
                          className="block rounded-xl border p-4 hover:bg-slate-50"
                        >
                          <p className="font-semibold">
                            {item.title}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {item.caseNumber} ·{" "}
                            {item.clientName ||
                              "Unknown Client"}
                          </p>
                        </Link>
                      )
                    )}
                  </SearchGroup>

                  {(userRole === "Manager" ||
                    userRole === "Lawyer") && (
                    <SearchGroup
                      title="Legal Articles"
                      count={
                        searchResults.articles.length
                      }
                      icon={<Scale size={17} />}
                    >
                      {searchResults.articles.map(
                        (article) => (
                          <Link
                            key={article.id}
                            href="/articles"
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchTerm("");
                            }}
                            className="block rounded-xl border p-4 hover:bg-slate-50"
                          >
                            <p className="font-semibold">
                              {
                                article.articleNumber
                              }{" "}
                              — {article.title}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {article.lawName}
                              {article.jurisdiction
                                ? ` · ${article.jurisdiction}`
                                : ""}
                            </p>
                          </Link>
                        )
                      )}
                    </SearchGroup>
                  )}

                  <SearchGroup
                    title="Documents"
                    count={
                      searchResults.documents.length
                    }
                    icon={<FileText size={17} />}
                  >
                    {searchResults.documents.map(
                      (document) => (
                        <Link
                          key={document.id}
                          href="/documents"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchTerm("");
                          }}
                          className="block rounded-xl border p-4 hover:bg-slate-50"
                        >
                          <p className="font-semibold">
                            {document.title}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {document.lawyerName}
                          </p>
                        </Link>
                      )
                    )}
                  </SearchGroup>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SidebarContent({
  lawyer,
  onLogout,
}: {
  lawyer: LawyerUser;
  onLogout: () => void | Promise<void>;
}) {
  const visibleNavigation =
    getNavigationForRole(lawyer.role);

  return (
    <>
      <div className="flex h-20 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950">
          <Scale size={22} />
        </div>

        <div>
          <h1 className="text-lg font-bold">
            Legal Desk
          </h1>

          <p className="text-xs text-slate-400">
            Lawyer Management
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {visibleNavigation.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                item.href === "/"
                  ? "bg-white text-slate-950"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-xl bg-slate-900 p-4">
          <p className="text-sm font-semibold">
            {lawyer.name}
          </p>

          <p className="mt-1 truncate text-xs text-slate-400">
            {lawyer.email}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {lawyer.role}
          </p>

          <button
            type="button"
            onClick={onLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold">
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium hover:bg-slate-50"
    >
      {icon}
      {text}
    </Link>
  );
}

function SearchGroup({
  title,
  count,
  icon,
  children,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  if (count === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        {icon}

        <h3 className="font-bold">
          {title}
        </h3>

        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
          {count}
        </span>
      </div>

      <div className="space-y-2">
        {children}
      </div>
    </section>
  );
}