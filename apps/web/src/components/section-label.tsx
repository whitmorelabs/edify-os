import { Sparkles } from "lucide-react";

export default function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm font-semibold text-[#d2b4fe] mb-4 uppercase">
      <Sparkles className="w-4 h-4" />
      {text}
    </div>
  );
}
