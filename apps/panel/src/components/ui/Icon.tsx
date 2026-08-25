type IconProps = {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
};

export function Icon({ name, className = '', filled = true, size = 24 }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      translate="no"
      style={{
        fontFamily: "'Material Symbols Outlined'",
        fontSize: `${size}px`,
        fontVariationSettings: filled
          ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
          : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
      }}
      aria-hidden
    >
      {name}
    </span>
  );
}
