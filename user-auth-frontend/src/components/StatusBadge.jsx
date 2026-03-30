function StatusBadge({
  label,
  toneClass,
  widthClass = "w-28",
  textClass = "text-xs",
  paddingClass = "px-2 py-0.5",
  className = "",
}) {
  const badgeClassName = [
    "inline-flex items-center justify-center rounded whitespace-nowrap",
    paddingClass,
    textClass,
    widthClass,
    toneClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={badgeClassName}>{label}</span>;
}

export default StatusBadge;