/**
 * Edify OS — UI primitive barrel export.
 * Import primitives via `@/components/ui` so propagation agents can
 * reach everything in one line:
 *   import { Button, Card, StatCard, ChatBubble } from "@/components/ui";
 */

export { ARCHETYPES, ARCHETYPE_LIST } from "./archetypes";
export type { Archetype, ArchetypeKey } from "./archetypes";
export { ArchetypeMark, ArchetypePortrait } from "./archetype-mark";
export type { ArchetypeMarkProps, ArchetypePortraitProps } from "./archetype-mark";

export { Button } from "./button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./button";

export { Input, Textarea } from "./input";
export type { InputProps, TextareaProps } from "./input";

export { Card, CardHeader, CardBody, CardFooter } from "./card";
export type { CardProps, CardElevation } from "./card";

export { Badge } from "./badge";
export type { BadgeProps, BadgeTone } from "./badge";

export { Avatar } from "./avatar";
export type { AvatarProps } from "./avatar";

export { Dialog } from "./dialog";
export type { DialogProps } from "./dialog";

export { ToastProvider, useToast } from "./toast";
export type { Toast, ToastTone } from "./toast";

export { StatCard } from "./stat-card";
export type { StatCardProps } from "./stat-card";

export { ActivityRow } from "./activity-row";
export type { ActivityRowProps } from "./activity-row";

export { QuickActionTile } from "./quick-action-tile";
export type { QuickActionTileProps } from "./quick-action-tile";

export { ChatBubble } from "./chat-bubble";
export type { ChatBubbleProps } from "./chat-bubble";

export { TypingIndicator } from "./typing-indicator";
export type { TypingIndicatorProps } from "./typing-indicator";

export { SuggestionChip } from "./suggestion-chip";
export type { SuggestionChipProps } from "./suggestion-chip";

export { ApprovalCard } from "./approval-card";
export type { ApprovalCardProps } from "./approval-card";

export { FileCard } from "./file-card";
export type { FileCardProps } from "./file-card";
