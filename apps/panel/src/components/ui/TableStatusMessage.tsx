type Props = {
  message: string;
  variant?: 'empty' | 'error' | 'info';
};

export function TableStatusMessage({ message, variant = 'empty' }: Props) {
  const tone =
    variant === 'error'
      ? 'text-error'
      : variant === 'info'
        ? 'text-outline'
        : 'text-on-surface-variant';

  return (
    <p className={`border-t border-surface-variant px-4 py-4 text-center text-body-sm ${tone}`}>
      {message}
    </p>
  );
}
