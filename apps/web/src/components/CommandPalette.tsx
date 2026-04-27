"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, X, MessageSquare } from "lucide-react";
import {
  ARCHETYPE_CONFIG,
  ARCHETYPE_SLUGS,
} from "@/lib/archetype-config";
import type { ArchetypeSlug } from "@/app/dashboard/inbox/heartbeats";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  href: string;
  section: "agents" | "conversations";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build agent items from archetype config. */
function buildAgentItems(): PaletteItem[] {
  return ARCHETYPE_SLUGS.map((slug) => {
    const config = ARCHETYPE_CONFIG[slug];
    const Icon = config.icon;
    return {
      id: `agent-${slug}`,
      label: config.label,
      sublabel: config.description,
      icon: (
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg shrink-0",
            config.bg
          )}
        >
          <Icon size={14} className="text-white" />
        </div>
      ),
      href: `/dashboard/team/${slug}`,
      section: "agents" as const,
    };
  });
}

/** Try to load recent conversations from localStorage for the command palette. */
function loadRecentConversations(): PaletteItem[] {
  if (typeof window === "undefined") return [];

  const items: PaletteItem[] = [];

  try {
    for (const slug of ARCHETYPE_SLUGS) {
      const raw = localStorage.getItem(`chat:conversations:${slug}`);
      if (!raw) continue;
      const convs = JSON.parse(raw) as Array<{
        id: string;
        title: string;
        updatedAt: string;
      }>;
      const config = ARCHETYPE_CONFIG[slug as ArchetypeSlug];
      for (const conv of convs.slice(0, 3)) {
        items.push({
          id: `conv-${conv.id}`,
          label: conv.title || "Untitled conversation",
          sublabel: config.label,
          icon: (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-3)] shrink-0">
              <MessageSquare size={14} className="text-[var(--fg-3)]" />
            </div>
          ),
          href: `/dashboard/team/${slug}`,
          section: "conversations" as const,
        });
      }
    }
  } catch {
    // localStorage errors — return what we have
  }

  // Sort by most recent and cap at 8
  return items.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const agentItems = useMemo(() => buildAgentItems(), []);
  const [conversationItems, setConversationItems] = useState<PaletteItem[]>([]);

  // Load conversations when palette opens
  useEffect(() => {
    if (open) {
      setConversationItems(loadRecentConversations());
      setQuery("");
      setSelectedIndex(0);
      // Focus input after a tick so the dialog is visible
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Close palette on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Filter items by query
  const filteredItems = useMemo(() => {
    const allItems = [...agentItems, ...conversationItems];
    if (!query.trim()) return allItems;

    const lowerQuery = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(lowerQuery) ||
        (item.sublabel && item.sublabel.toLowerCase().includes(lowerQuery))
    );
  }, [query, agentItems, conversationItems]);

  // Group items by section for display
  const groupedItems = useMemo(() => {
    const agents = filteredItems.filter((i) => i.section === "agents");
    const conversations = filteredItems.filter(
      (i) => i.section === "conversations"
    );
    return { agents, conversations };
  }, [filteredItems]);

  // Keep selectedIndex in bounds
  useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems.length, selectedIndex]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      setOpen(false);
      router.push(item.href);
    },
    [router]
  );

  // Keyboard navigation inside the palette
  function handlePaletteKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredItems.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filteredItems[selectedIndex];
      if (item) handleSelect(item);
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!open) return null;

  // Build a flat index counter for rendering
  let flatIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Palette modal */}
      <div
        className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] px-4"
        onKeyDown={handlePaletteKeyDown}
      >
        <div className="w-full max-w-lg bg-[var(--bg-1)] border border-[var(--line-1)] rounded-2xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--line-1)]">
            <Search size={18} className="text-[var(--fg-3)] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search agents and conversations..."
              className="flex-1 bg-transparent text-sm text-[var(--fg-1)] placeholder:text-[var(--fg-4)] outline-none"
            />
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded text-[var(--fg-3)] hover:text-[var(--fg-1)] transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Results list */}
          <div
            ref={listRef}
            className="max-h-[50vh] overflow-y-auto py-2"
          >
            {filteredItems.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-[var(--fg-3)]">
                No results found
              </p>
            )}

            {/* Agents section */}
            {groupedItems.agents.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[var(--fg-3)]">
                  Team Members
                </p>
                {groupedItems.agents.map((item) => {
                  const idx = flatIndex++;
                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition",
                        idx === selectedIndex
                          ? "bg-[var(--bg-3)]"
                          : "hover:bg-[var(--bg-2)]"
                      )}
                    >
                      {item.icon}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--fg-1)] truncate">
                          {item.label}
                        </p>
                        {item.sublabel && (
                          <p className="text-xs text-[var(--fg-3)] truncate">
                            {item.sublabel}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Conversations section */}
            {groupedItems.conversations.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[var(--fg-3)] mt-1">
                  Recent Conversations
                </p>
                {groupedItems.conversations.map((item) => {
                  const idx = flatIndex++;
                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition",
                        idx === selectedIndex
                          ? "bg-[var(--bg-3)]"
                          : "hover:bg-[var(--bg-2)]"
                      )}
                    >
                      {item.icon}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--fg-1)] truncate">
                          {item.label}
                        </p>
                        {item.sublabel && (
                          <p className="text-xs text-[var(--fg-3)] truncate">
                            {item.sublabel}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-t border-[var(--line-1)] text-xs text-[var(--fg-3)]">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-3)] border border-[var(--line-2)] font-mono text-[10px]">
                ↑↓
              </kbd>{" "}
              navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-3)] border border-[var(--line-2)] font-mono text-[10px]">
                ↵
              </kbd>{" "}
              select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-3)] border border-[var(--line-2)] font-mono text-[10px]">
                esc
              </kbd>{" "}
              close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
