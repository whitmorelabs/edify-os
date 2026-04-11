"use client";

import { useState } from "react";
import { Trash2, ChevronDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  lastActive: string;
  avatarInitials: string;
}

interface MemberTableProps {
  members: Member[];
  onRoleChange: (memberId: string, newRole: "admin" | "member") => void;
  onRemove: (member: Member) => void;
}

const roleBadge: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700 border border-purple-200",
  admin: "bg-sky-100 text-sky-700 border border-sky-200",
  member: "bg-slate-100 text-slate-600 border border-slate-200",
};

const roleLabel: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateStr);
}

export function MemberTable({ members, onRoleChange, onRemove }: MemberTableProps) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-3">
          <Users className="h-7 w-7 text-slate-400" />
        </div>
        <p className="font-medium text-slate-700">No members yet</p>
        <p className="text-sm text-slate-500 mt-1">Invite someone to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 pr-4">
              Member
            </th>
            <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 pr-4 hidden sm:table-cell">
              Role
            </th>
            <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 pr-4 hidden md:table-cell">
              Joined
            </th>
            <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 pr-4 hidden lg:table-cell">
              Last Active
            </th>
            <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {members.map((member) => (
            <tr key={member.id} className="group">
              {/* Avatar + name + email */}
              <td className="py-3.5 pr-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {member.avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{member.name}</p>
                    <p className="text-xs text-slate-500 truncate">{member.email}</p>
                    {/* Mobile role badge */}
                    <span
                      className={cn(
                        "mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium sm:hidden",
                        roleBadge[member.role]
                      )}
                    >
                      {roleLabel[member.role]}
                    </span>
                  </div>
                </div>
              </td>

              {/* Role */}
              <td className="py-3.5 pr-4 hidden sm:table-cell">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    roleBadge[member.role]
                  )}
                >
                  {roleLabel[member.role]}
                </span>
              </td>

              {/* Joined */}
              <td className="py-3.5 pr-4 text-slate-500 hidden md:table-cell">
                {formatDate(member.joinedAt)}
              </td>

              {/* Last active */}
              <td className="py-3.5 pr-4 text-slate-500 hidden lg:table-cell">
                {timeAgo(member.lastActive)}
              </td>

              {/* Actions */}
              <td className="py-3.5 text-right">
                {member.role !== "owner" ? (
                  <div className="flex items-center justify-end gap-2">
                    {/* Role dropdown */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setRoleDropdownOpen(
                            roleDropdownOpen === member.id ? null : member.id
                          )
                        }
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Change role
                        <ChevronDown className="h-3 w-3 text-slate-400" />
                      </button>

                      {roleDropdownOpen === member.id && (
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setRoleDropdownOpen(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                            {(["admin", "member"] as const).map((r) => (
                              <button
                                key={r}
                                onClick={() => {
                                  onRoleChange(member.id, r);
                                  setRoleDropdownOpen(null);
                                }}
                                className={cn(
                                  "w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors",
                                  member.role === r
                                    ? "font-medium text-brand-600"
                                    : "text-slate-700"
                                )}
                              >
                                {roleLabel[r]}
                                {member.role === r && (
                                  <span className="ml-1 text-xs text-slate-400">(current)</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => onRemove(member)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${member.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
