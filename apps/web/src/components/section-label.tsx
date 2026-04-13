import { Sparkles } from "lucide-react";

interface SectionLabelProps {
  text: string;
  /** Pass "left" to left-align within a left-aligned column. Defaults to centered. */
  align?: "center" | "left";
  className?: string;
}

export default function SectionLabel({ text, align = "center", className }: SectionLabelProps) {
  return (
    <div
      className={`flex items-center gap-2.5 text-sm font-semibold text-[#8B5CF6] mb-4 uppercase ${
        align === "center" ? "justify-center" : ""
      } ${className ?? ""}`}
    >
      <Sparkles className="w-4 h-4" />
      {text}
    </div>
  );
}
