import { SessionUser } from "./auth";

export type AppRole = "Manager" | "Lawyer" | "Assistant";

export type Permission =
  | "clients"
  | "cases"
  | "articles"
  | "documents"
  | "users";

const permissions: Record<AppRole, Permission[]> = {
  Manager: [
    "clients",
    "cases",
    "articles",
    "documents",
    "users",
  ],

  Lawyer: [
    "clients",
    "cases",
    "articles",
    "documents",
  ],

  Assistant: [
    "clients",
    "cases",
    "documents",
  ],
};

export function hasPermission(
  user: SessionUser | null,
  permission: Permission
): boolean {
  if (!user) {
    return false;
  }

  const role = user.role as AppRole;

  if (!permissions[role]) {
    return false;
  }

  return permissions[role].includes(permission);
}

export function requirePermission(
  user: SessionUser | null,
  permission: Permission
) {
  if (!hasPermission(user, permission)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}

export function isManager(
  user: SessionUser | null
): boolean {
  return user?.role === "Manager";
}

export function isLawyer(
  user: SessionUser | null
): boolean {
  return user?.role === "Lawyer";
}

export function isAssistant(
  user: SessionUser | null
): boolean {
  return user?.role === "Assistant";
}