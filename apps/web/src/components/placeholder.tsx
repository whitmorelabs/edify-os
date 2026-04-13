export default function Placeholder({
  className = "",
  label,
  src,
}: {
  className?: string;
  label?: string;
  src?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={label ?? ""}
        className={`object-cover rounded-xl ${className}`}
      />
    );
  }

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
