# Edify UI Primitives

Typed React components that implement the Claude Design system. Propagation
agents should prefer these over hand-rolled Tailwind elements — that keeps
every screen consistent as the team names their directors and Edify fills out.

Dark-first. Brand purple `#9F4EF3`. Instrument Sans + JetBrains Mono.

---

## Where things live

```
apps/web/src/
├── app/
│   ├── globals.css          # tokens (CSS vars + @theme)
│   └── layout.tsx           # next/font for Instrument Sans + JetBrains Mono
├── components/
│   ├── landing/
│   │   └── animated-dashboard.tsx
│   └── ui/
│       ├── archetypes.tsx       # 6 archetypes + Lucide-style icons
│       ├── archetype-mark.tsx   # ArchetypeMark + ArchetypePortrait
│       ├── button.tsx
│       ├── input.tsx            # Input + Textarea
│       ├── card.tsx             # Card + Header/Body/Footer
│       ├── badge.tsx
│       ├── avatar.tsx
│       ├── dialog.tsx
│       ├── toast.tsx            # ToastProvider + useToast()
│       ├── stat-card.tsx
│       ├── activity-row.tsx
│       ├── quick-action-tile.tsx
│       ├── chat-bubble.tsx
│       ├── typing-indicator.tsx
│       ├── suggestion-chip.tsx
│       ├── approval-card.tsx
│       └── index.ts
└── lib/
    └── motion.ts            # Framer Motion tokens + shared variants
```

Import primitives through the barrel:

```tsx
import { Button, Card, StatCard, ChatBubble, ARCHETYPES } from "@/components/ui";
```

Import motion helpers separately:

```tsx
import { DURATION, EASE, entrance, staggerContainer, useMotionPrefs } from "@/lib/motion";
```

---

## Tokens — quick reference

### Colors

**Brand ramp** (use `brand-500` = `#9F4EF3` as the primary):

| Token | Hex | Use |
|---|---|---|
| `bg-brand-500` | `#9F4EF3` | Primary buttons, active states, key focus |
| `text-brand-500` | `#9F4EF3` | Link hover, "active" icons |
| `brand-200` | `#D8B8F9` | Eyebrow text, secondary links |
| `brand-900` | `#3F1F5C` | Plum deep — hero backgrounds |

Never use Spial-era `#7C3AED` or `#8B5CF6`. Brand is `#9F4EF3`.

**Surfaces** (all near-black — NOT navy):

| Token | Hex | Use |
|---|---|---|
| `bg-bg-0` | `#07070B` | Viewport / deepest |
| `bg-bg-1` | `#0A0A0F` | App background |
| `bg-bg-2` | `#111119` | Raised cards |
| `bg-bg-3` | `#17171F` | Popovers, elevated |
| `bg-bg-plum-1` | `#120C1E` | Hero plum tint |

**Text**:

| Token | Use |
|---|---|
| `text-fg-1` | Primary text |
| `text-fg-2` | Secondary |
| `text-fg-3` | Tertiary / meta |
| `text-fg-4` | Disabled / placeholder / unnamed slots |
| `text-fg-on-purple` | Text on brand purple — always `#0A0A0F`, never white |

**Director accents** — use to identify, not to brand:

| Archetype | Var | Hex |
|---|---|---|
| Executive Assistant | `--dir-exec` | `#9F4EF3` |
| Events Director | `--dir-events` | `#F472B6` |
| Development Director | `--dir-dev` | `#F59E5C` |
| Marketing Director | `--dir-marketing` | `#7DD3FC` |
| Programs Director | `--dir-programs` | `#4ADE80` |
| HR & Volunteer Coordinator | `--dir-hr` | `#FCD34D` |

### Shadows

Dark UIs don't read depth from drop-shadow alone. Use the elevation recipe:

- `shadow-elev-0` — hairline border only
- `shadow-elev-1` — default card (1px top-highlight + soft shadow + border)
- `shadow-elev-2` — raised / hovered
- `shadow-elev-3` — sheets, popovers
- `shadow-elev-4` — modals
- `shadow-glow-sm/md/lg` — reserved for primary buttons, file arrival, director-is-thinking. Never a general depth tool.

### Radii

- `rounded-md` — inputs, chips (10px)
- `rounded-lg` — default card (14px)
- `rounded-xl` — hero cards, modals (20px)
- `rounded-full` — suggestion chips, status dots, avatars

**Never mix 8px and 12px on the same screen** — pick one rung.

---

## Typography

- Display / h1 / h2: weight **600** (not 700 — 700 reads as marketing-template bold).
- Tracking `-0.02em` on display, `-0.01em` on h2.
- Body: weight 400 / `text-base` (15px).
- **Eyebrows** (section labels, stat card labels, nav): UPPERCASE, tracked `0.14em`, color `var(--brand-tint)`. Use the `.eyebrow` utility class in globals.css.
- **Sentence case** for buttons, headings, nav — never Title Case.
- **No emoji in UI chrome.** Icons only.

---

## Motion — intent-first

Never pick easing by shape — pick by intent:

```tsx
import { EASE, DURATION } from "@/lib/motion";

motion.div transition={{ duration: DURATION.base, ease: EASE.entrance }}
```

| Easing | Use |
|---|---|
| `EASE.standard` | Default hover, toggle, small state |
| `EASE.entrance` | Things appearing |
| `EASE.exit` | Things leaving |
| `EASE.emphasis` | Satisfying moments: approval accepted, file arrived |
| `EASE.linear` | Loops only |

Durations `instant / fast / base / slow / slower / ambient` map directly to the CSS tokens. Never exceed `slower` (520ms) for an affordance the user is waiting on.

**Reduced motion** is handled globally — CSS durations collapse to 0 under `prefers-reduced-motion: reduce`. For Framer Motion components that opt into specific behaviors, call `useMotionPrefs()` and use its returned `duration` map, or wrap your variants in `maybeReduce(variants, reduced)`.

---

## Primitive recipes

### Button

```tsx
<Button variant="primary" size="md" onClick={...}>
  Request early access
</Button>

<Button variant="secondary" trailingIcon={<ArrowRight size={14}/>}>
  See it in action
</Button>

<Button variant="ghost" size="sm">Discard</Button>
```

### Card

```tsx
<Card elevation={1} className="p-6">
  <div className="eyebrow">TASKS DONE</div>
  <div className="mt-2 text-4xl font-mono">127</div>
</Card>

// Hero card with plum tint
<Card hero elevation={2} className="p-8">
  …
</Card>
```

### StatCard (count-up)

```tsx
<StatCard label="TASKS DONE" value={127} hint="↑ 23 this week" />
<StatCard label="NEEDS YOU" value={4} tone="warn" />
```

### Archetype visuals

```tsx
import { ARCHETYPES, ArchetypeMark, ArchetypePortrait } from "@/components/ui";

// 40px tile — use as avatar
<ArchetypeMark arc={ARCHETYPES.exec} size={40} />

// Big hero portrait with concentric arcs
<ArchetypePortrait arc={ARCHETYPES.dev} size={200} />
```

### ChatBubble

```tsx
<ChatBubble role="user">Prep me for Tuesday's board meeting.</ChatBubble>

<ChatBubble role="agent" arc={ARCHETYPES.exec}>
  Pulled last quarter's numbers and drafted opening remarks.
</ChatBubble>

<ChatBubble role="agent" arc={ARCHETYPES.dev} trailing={<FileCard … />}>
  Drafted the thank-you. Ready for your review.
</ChatBubble>
```

### ApprovalCard

```tsx
<ApprovalCard
  arc={ARCHETYPES.dev}
  title="Thank you — Anne Harlow ($5,000)"
  ago="3 min ago"
  preview="Dear Anne, thank you so much for your generous gift…"
  leaving={leaving}       // "approve" | "reject" | undefined
  onApprove={() => remove(id, "approve")}
  onReject={() => remove(id, "reject")}
  onEdit={() => openEditor(id)}
/>
```

Parent should unmount the card ~450ms after setting `leaving` so the exit transition plays cleanly.

### Dialog + Toast

```tsx
const [open, setOpen] = useState(false);

<Dialog open={open} onClose={() => setOpen(false)} title="Give them a name">
  <Input placeholder="e.g. Maya" />
  <Button className="mt-4">Save</Button>
</Dialog>
```

```tsx
// Wrap the app once in <ToastProvider>, then:
const { toast } = useToast();
toast({ tone: "success", title: "Approved", description: "The draft was sent." });
```

---

## Naming directors

Orgs name their own directors. **Never hardcode a default name.** Use the italic `— unnamed —` slot (look at `app/dashboard/page.tsx::NameSlot`) until the user has set one. Role (Executive Assistant, Events Director, …) is fine to show at any time — that's the archetype, not the personality.

---

## Propagation checklist for each screen

When rebuilding a screen from the light-SaaS look to the new system:

1. Swap the outer surface to `bg-bg-1` (or `bg-bg-0` for deeper).
2. Replace `bg-white` cards with `Card` primitive or `bg-bg-2` + `shadow-elev-1`.
3. Replace any `#7C3AED` / `#8B5CF6` with `var(--brand-purple)` (or `bg-brand-500`).
4. Replace `text-gray-*` / `text-slate-*` with `text-fg-1/2/3/4`.
5. Buttons → `<Button>` primitive. No more `.btn-primary` / `.spial-btn` unless you're touching a marketing page that still uses them.
6. Headings → sentence case, weight 600, tight tracking.
7. Section labels / eyebrows → `.eyebrow` utility (UPPERCASE + `0.14em` tracking + `--brand-tint`).
8. Any agent avatar → `<ArchetypeMark>` with the correct archetype.
9. Any stat → `<StatCard>` (count-up + mono font).
10. Any activity row → `<ActivityRow>`.
11. Any chat bubble → `<ChatBubble>`. No floating blue FAB anywhere — the composer is the only chat affordance.
12. Motion: durations from `DURATION`, easings from `EASE`, stagger at 40ms base.
13. Test `prefers-reduced-motion` — if you add a new looping animation, wrap it in `useReducedMotion()` or CSS `@media (prefers-reduced-motion: reduce)`.

---

## What NOT to do

- Don't hardcode hex colors — always use tokens (`var(--…)` or `brand-500`, `bg-bg-2`, etc.).
- Don't introduce new purple shades. `#9F4EF3` is the only brand purple.
- Don't use Title Case anywhere — sentence case for copy, UPPERCASE-tracked for eyebrows only.
- Don't drop emoji in UI chrome. Icons only.
- Don't mix 8px and 12px radii on the same screen.
- Don't apply colored left borders on cards (banned — "AI-SaaS cliché"). Use the director accent as a top corner indicator or header stripe.
- Don't add glass-card (backdrop-blur) surfaces except the sticky top bar and sheet overlays. Solid `bg-bg-2` + `shadow-elev-1` is the default card.
- Don't exceed 520ms for UI affordances. Stagger children instead of stretching individual motion.
