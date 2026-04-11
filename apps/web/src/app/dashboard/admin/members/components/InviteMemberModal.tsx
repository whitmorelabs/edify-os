"use client";

import { useState } from "react";
import { X, Mail, ChevronDown, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InviteMemberModalProps {
  onClose: () => void;
  onSuccess: (email: string, role: string) => void;
}

const roles = [
  { value: "member", label: "Member", description: "Can use the platform but can't change settings." },
  { value: "admin", label: "Admin", description: "Can manage members and configure AI settings." },
];

export function InviteMemberModal({ onClose, onSuccess }: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const selectedRole = roles.find((r) => r.value === role)!;

  async function handleSend() {
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      if (!res.ok) throw new Error("Request failed");

      setStatus("success");
      onSuccess(email.trim(), role);
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="heading-3">Invite Team Member</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              They&apos;ll receive an email with a link to join.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Email input */}
          <div>
            <label className="label mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@nonprofit.org"
                className="input-field pl-9"
                disabled={status === "success" || status === "loading"}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
            </div>
          </div>

          {/* Role selector */}
          <div>
            <label className="label mb-1.5 block">Role</label>
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                disabled={status === "success" || status === "loading"}
                className="w-full flex items-center justify-between rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                <span className="font-medium">{selectedRole.label}</span>
                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", roleDropdownOpen && "rotate-180")} />
              </button>

              {roleDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setRoleDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => { setRole(r.value); setRoleDropdownOpen(false); }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900">{r.label}</span>
                          {role === r.value && <Check className="h-4 w-4 text-brand-500" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Error */}
          {(errorMsg || status === "error") && (
            <div className="flex items-center gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3.5 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{errorMsg || "Something went wrong."}</p>
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-3">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
              <p className="text-sm text-emerald-700">
                Invitation sent to <strong>{email}</strong> as {selectedRole.label}.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="btn-secondary py-2 px-4">
            {status === "success" ? "Done" : "Cancel"}
          </button>
          {status !== "success" && (
            <button
              onClick={handleSend}
              disabled={status === "loading" || !email.trim()}
              className="btn-primary py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Sending..." : "Send Invite"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
