import { supabase } from "@/lib/supabase";

export type AdminRole = "super_admin" | "content_admin" | "finance_admin" | "protocol_admin" | "viewer";

export interface AdminUser {
  wallet_address: string;
  role: AdminRole;
  display_name?: string;
  granted_at: string;
  granted_by?: string;
}

/**
 * Permission matrix for admin roles.
 * super_admin has all permissions. Other roles are restricted.
 */
const ROLE_PERMISSIONS: Record<AdminRole, Set<string>> = {
  super_admin: new Set([
    "users.read",
    "users.write",
    "users.delete",
    "articles.read",
    "articles.write",
    "articles.seed",
    "articles.delete",
    "citations.read",
    "revenue.read",
    "revenue.export",
    "subscriptions.read",
    "subscriptions.write",
    "protocol.read",
    "protocol.write",
    "protocol.pause",
    "audit.read",
    "admin.manage",
  ]),
  content_admin: new Set([
    "users.read",
    "articles.read",
    "articles.write",
    "articles.seed",
    "citations.read",
    "audit.read",
  ]),
  finance_admin: new Set([
    "users.read",
    "revenue.read",
    "revenue.export",
    "subscriptions.read",
    "subscriptions.write",
    "citations.read",
    "audit.read",
  ]),
  protocol_admin: new Set([
    "protocol.read",
    "protocol.write",
    "users.read",
    "audit.read",
  ]),
  viewer: new Set([
    "users.read",
    "articles.read",
    "citations.read",
    "revenue.read",
    "subscriptions.read",
    "protocol.read",
    "audit.read",
  ]),
};

/**
 * Verify that a wallet address has an admin role.
 * Queries the admin_roles table in Supabase.
 */
export async function verifyAdminRole(walletAddress: string): Promise<AdminUser | null> {
  try {
    const { data, error } = await supabase
      .from("admin_roles")
      .select("*")
      .eq("wallet_address", walletAddress)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      wallet_address: data.wallet_address,
      role: data.role as AdminRole,
      display_name: data.display_name,
      granted_at: data.granted_at,
      granted_by: data.granted_by,
    };
  } catch (err) {
    console.error("[admin-auth] Error verifying admin role:", err);
    return null;
  }
}

/**
 * Check if a given admin role has a specific permission.
 */
export function hasPermission(role: AdminRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.has(permission);
}

/**
 * Get all permissions for a given role.
 */
export function getRolePermissions(role: AdminRole): string[] {
  return Array.from(ROLE_PERMISSIONS[role] || []);
}

/**
 * Log an admin action to the audit_log table.
 */
export async function logAdminAction(
  walletAddress: string,
  action: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    await supabase.from("audit_log").insert({
      admin_wallet: walletAddress,
      action,
      details: details || {},
      performed_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[admin-auth] Failed to log admin action:", err);
  }
}
