export default function Placeholder({
  className = "",
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={`bg-[#e5e5e5] rounded-xl flex items-center justify-center ${className}`}
    >
      {label && (
        <span className="text-[#999] text-sm select-none">{label}</span>
      )}
    </div>
  );
}
