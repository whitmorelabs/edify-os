"use client";

import { AGENT_COLORS, type AgentRoleSlug } from "@/lib/agent-colors";
import { cn } from "@/lib/utils";

interface AgentAvatarProps {
  role: AgentRoleSlug;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  status?: "active" | "idle" | "offline";
}

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
};

const iconSizes: Record<"sm" | "md" | "lg", number> = {
  sm: 16,
  md: 20,
  lg: 28,
};

const statusColors: Record<"active" | "idle" | "offline", string> = {
  active: "bg-emerald-500",
  idle: "bg-amber-500",
  offline: "bg-slate-400",
};

export function AgentAvatar({
  role,
  size = "md",
  showStatus = false,
  status = "offline",
}: AgentAvatarProps) {
  const config = AGENT_COLORS[role];
  const Icon = config.icon;

  return (
    <div className="relative inline-flex">
      <div
        className={cn(
          "rounded-full flex items-center justify-center",
          config.bg,
          sizeClasses[size]
        )}
      >
        <Icon size={iconSizes[size]} className="text-white" />
      </div>

      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-white",
            statusColors[status],
            size === "sm" ? "w-2 h-2" : size === "md" ? "w-2.5 h-2.5" : "w-3 h-3"
          )}
        />
      )}
    </div>
  );
}
