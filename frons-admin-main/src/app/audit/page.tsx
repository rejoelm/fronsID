"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  Shield,
  UserCog,
  Trash2,
  Edit3,
  Plus,
  Eye,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react";

interface AuditEntry {
  id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  old_value: string | null;
  new_value: string | null;
  ip_address: string;
  created_at: string;
}

const ACTION_TYPES = [
  "all",
  "user.update",
  "user.delete",
  "article.publish",
  "article.reject",
  "settings.update",
  "protocol.pause",
  "protocol.unpause",
  "subscription.change",
];

const MOCK_AUDIT: AuditEntry[] = [
  {
    id: "1",
    admin_email: "admin@frons.science",
    action: "article.publish",
    target_type: "article",
    target_id: "10.fronsciers/2026.0042",
    old_value: JSON.stringify({ status: "under_review" }),
    new_value: JSON.stringify({ status: "published" }),
    ip_address: "192.168.1.100",
    created_at: "2026-03-14T15:30:00Z",
  },
  {
    id: "2",
    admin_email: "admin@frons.science",
    action: "user.update",
    target_type: "user",
    target_id: "user_dr_rejo",
    old_value: JSON.stringify({ subscription_tier: "scholar" }),
    new_value: JSON.stringify({ subscription_tier: "institution" }),
    ip_address: "192.168.1.100",
    created_at: "2026-03-14T14:10:00Z",
  },
  {
    id: "3",
    admin_email: "ops@frons.science",
    action: "settings.update",
    target_type: "platform_settings",
    target_id: "citation_fee",
    old_value: JSON.stringify({ citation_fee: 0.05 }),
    new_value: JSON.stringify({ citation_fee: 0.08 }),
    ip_address: "10.0.0.42",
    created_at: "2026-03-13T09:22:00Z",
  },
  {
    id: "4",
    admin_email: "ops@frons.science",
    action: "protocol.pause",
    target_type: "protocol",
    target_id: "mainnet",
    old_value: JSON.stringify({ paused: false }),
    new_value: JSON.stringify({ paused: true }),
    ip_address: "10.0.0.42",
    created_at: "2026-03-12T22:05:00Z",
  },
  {
    id: "5",
    admin_email: "admin@frons.science",
    action: "article.reject",
    target_type: "article",
    target_id: "10.fronsciers/2026.0145",
    old_value: JSON.stringify({ status: "under_review" }),
    new_value: JSON.stringify({ status: "rejected" }),
    ip_address: "192.168.1.100",
    created_at: "2026-03-12T11:45:00Z",
  },
  {
    id: "6",
    admin_email: "admin@frons.science",
    action: "user.delete",
    target_type: "user",
    target_id: "user_spam_account",
    old_value: JSON.stringify({ display_name: "SpamBot99" }),
    new_value: null,
    ip_address: "192.168.1.100",
    created_at: "2026-03-11T16:30:00Z",
  },
  {
    id: "7",
    admin_email: "ops@frons.science",
    action: "protocol.unpause",
    target_type: "protocol",
    target_id: "mainnet",
    old_value: JSON.stringify({ paused: true }),
    new_value: JSON.stringify({ paused: false }),
    ip_address: "10.0.0.42",
    created_at: "2026-03-12T23:10:00Z",
  },
  {
    id: "8",
    admin_email: "admin@frons.science",
    action: "subscription.change",
    target_type: "subscription",
    target_id: "sub_prof_ava",
    old_value: JSON.stringify({ tier: "scholar" }),
    new_value: JSON.stringify({ tier: "enterprise" }),
    ip_address: "192.168.1.100",
    created_at: "2026-03-10T08:15:00Z",
  },
];

function getActionConfig(action: string) {
  if (action.startsWith("article.publish"))
    return { icon: Eye, color: "bg-green-100 text-green-700", label: "Publish" };
  if (action.startsWith("article.reject"))
    return { icon: AlertTriangle, color: "bg-red-100 text-red-700", label: "Reject" };
  if (action.startsWith("user.update"))
    return { icon: UserCog, color: "bg-blue-100 text-blue-700", label: "User Update" };
  if (action.startsWith("user.delete"))
    return { icon: Trash2, color: "bg-red-100 text-red-700", label: "User Delete" };
  if (action.startsWith("settings"))
    return { icon: Edit3, color: "bg-[#E5E0FE] text-[#2C337A]", label: "Settings" };
  if (action.startsWith("protocol.pause"))
    return { icon: Lock, color: "bg-orange-100 text-orange-700", label: "Pause" };
  if (action.startsWith("protocol.unpause"))
    return { icon: Unlock, color: "bg-green-100 text-green-700", label: "Unpause" };
  if (action.startsWith("subscription"))
    return { icon: Shield, color: "bg-purple-100 text-purple-700", label: "Subscription" };
  return { icon: Plus, color: "bg-gray-100 text-gray-600", label: action };
}

function ActionBadge({ action }: { action: string }) {
  const config = getActionConfig(action);
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function truncateJson(val: string | null): string {
  if (!val) return "--";
  try {
    const obj = JSON.parse(val);
    const entries = Object.entries(obj);
    if (entries.length === 0) return "--";
    return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
  } catch {
    return val.length > 40 ? val.slice(0, 40) + "..." : val;
  }
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [adminFilter, setAdminFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    async function fetchAuditLog() {
      try {
        const { data } = await supabase
          .from("audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);

        if (data && data.length > 0) {
          setEntries(data);
        } else {
          setEntries(MOCK_AUDIT);
        }
      } catch {
        setEntries(MOCK_AUDIT);
      } finally {
        setLoading(false);
      }
    }
    fetchAuditLog();
  }, []);

  const adminEmails = useMemo(() => {
    const unique = [...new Set(entries.map((e) => e.admin_email))];
    return ["all", ...unique];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    let result = [...entries];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.admin_email.toLowerCase().includes(q) ||
          e.target_id.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q)
      );
    }

    if (actionFilter !== "all") {
      result = result.filter((e) => e.action === actionFilter);
    }

    if (adminFilter !== "all") {
      result = result.filter((e) => e.admin_email === adminFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((e) => new Date(e.created_at) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59Z");
      result = result.filter((e) => new Date(e.created_at) <= to);
    }

    return result;
  }, [entries, searchQuery, actionFilter, adminFilter, dateFrom, dateTo]);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2C337A] flex items-center gap-3">
          <ClipboardList className="w-8 h-8" />
          Audit Log
        </h1>
        <p className="text-gray-500 mt-1">
          Track all administrative actions across the platform
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Actions</p>
              <p className="text-2xl font-bold text-[#2C337A] mt-1">
                {entries.length.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-[#E5E0FE] rounded-xl">
              <ClipboardList className="w-5 h-5 text-[#2C337A]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unique Admins</p>
              <p className="text-2xl font-bold text-[#2C337A] mt-1">
                {adminEmails.length - 1}
              </p>
            </div>
            <div className="p-3 bg-[#FFC6DE] rounded-xl">
              <UserCog className="w-5 h-5 text-[#2C337A]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today&apos;s Actions</p>
              <p className="text-2xl font-bold text-[#2C337A] mt-1">
                {entries.filter((e) => {
                  const d = new Date(e.created_at);
                  const today = new Date();
                  return d.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Shield className="w-5 h-5 text-[#FB7720]" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by admin, target, or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]/20 focus:border-[#2C337A] bg-[#F8F8FD]"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
            <select
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]/20 bg-[#F8F8FD]"
            >
              {adminEmails.map((a) => (
                <option key={a} value={a}>
                  {a === "all" ? "All Admins" : a}
                </option>
              ))}
            </select>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]/20 bg-[#F8F8FD]"
            >
              {ACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All Actions" : t}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]/20 bg-[#F8F8FD]"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C337A]/20 bg-[#F8F8FD]"
              placeholder="To"
            />
            <button
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 500);
              }}
              className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8F8FD] border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Admin</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Target</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Old Value</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">New Value</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">IP</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading audit log...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    No audit entries found
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-gray-100 hover:bg-[#F8F8FD] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{entry.admin_email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={entry.action} />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-xs text-gray-400 uppercase">{entry.target_type}</span>
                        <p className="font-mono text-xs text-[#FB7720]">{entry.target_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">
                      {truncateJson(entry.old_value)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">
                      {truncateJson(entry.new_value)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {entry.ip_address}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#F8F8FD] border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {filteredEntries.length} of {entries.length} entries
          </span>
        </div>
      </div>
    </div>
  );
}
