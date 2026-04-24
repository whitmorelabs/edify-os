"use client";

import { useEffect, useState } from "react";
import { UserPlus, AlertTriangle, X, Check } from "lucide-react";
import { MemberTable, type Member } from "./components/MemberTable";
import { InviteMemberModal } from "./components/InviteMemberModal";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/admin/members")
      .then((r) => r.json())
      .then((data) => { setMembers(data.members); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleRoleChange(memberId: string, newRole: "admin" | "member") {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
    fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, role: newRole }),
    });
    showToast("Role updated successfully.");
  }

  function handleRemoveConfirm() {
    if (!confirmRemove) return;
    setMembers((prev) => prev.filter((m) => m.id !== confirmRemove.id));
    fetch(`/api/admin/members?memberId=${confirmRemove.id}`, { method: "DELETE" });
    showToast(`${confirmRemove.name} has been removed.`);
    setConfirmRemove(null);
  }

  function handleInviteSuccess(email: string, role: string) {
    showToast(`Invite sent to ${email} as ${role}.`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="heading-1">Members</h1>
          <p className="text-sm text-fg-3 mt-0.5">
            {loading ? "Loading..." : `${members.length} ${members.length === 1 ? "person" : "people"} in your organization`}
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="btn-primary self-start"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {/* Stats strip */}
      {!loading && (
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2 rounded-full bg-brand-500/20 px-3 py-1.5 text-xs font-medium text-brand-700">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            {members.filter((m) => m.role === "owner").length} Owner
          </div>
          <div className="flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-xs font-medium text-sky-700">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            {members.filter((m) => m.role === "admin").length} Admin
          </div>
          <div className="flex items-center gap-2 rounded-full bg-bg-3 px-3 py-1.5 text-xs font-medium text-fg-3">
            <span className="h-2 w-2 rounded-full bg-fg-4" />
            {members.filter((m) => m.role === "member").length} Member
          </div>
        </div>
      )}

      {/* Table card */}
      <div className="card p-6">
        {loading ? (
          <div className="py-12 text-center text-fg-3 text-sm">Loading members...</div>
        ) : (
          <MemberTable
            members={members}
            onRoleChange={handleRoleChange}
            onRemove={(member) => setConfirmRemove(member)}
          />
        )}
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <InviteMemberModal
          onClose={() => setInviteOpen(false)}
          onSuccess={(email, role) => {
            handleInviteSuccess(email, role);
            setInviteOpen(false);
          }}
        />
      )}

      {/* Remove confirmation modal */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmRemove(null)} />
          <div className="relative w-full max-w-sm rounded-xl bg-bg-2 shadow-elev-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4 mx-auto">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="heading-3 text-center mb-2">Remove member?</h3>
            <p className="text-sm text-fg-3 text-center mb-6">
              <strong>{confirmRemove.name}</strong> will lose access to your organization. This can&apos;t be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                className="btn-secondary flex-1 py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveConfirm}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium ${
          toast.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {toast.type === "success" ? (
            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          )}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 text-fg-4 hover:text-fg-2">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
