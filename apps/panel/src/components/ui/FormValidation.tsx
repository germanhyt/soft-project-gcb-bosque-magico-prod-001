import { INPUT_CLASS, INPUT_ERROR_CLASS } from '../../constants/design';

export type FormikLite = {
  submitCount: number;
  touched: Record<string, unknown>;
  errors: Record<string, unknown>;
};

export function erroresVisibles(
  formik: FormikLite,
  labels: Record<string, string>,
): Array<{ key: string; label: string; msg: string }> {
  if (formik.submitCount === 0) return [];
  return Object.entries(formik.errors)
    .filter(([, msg]) => typeof msg === 'string')
    .map(([key, msg]) => ({
      key,
      label: labels[key] ?? key,
      msg: String(msg),
    }));
}

export function inputConError(formik: FormikLite, name: string) {
  const show = Boolean((formik.touched[name] || formik.submitCount > 0) && formik.errors[name]);
  return `${INPUT_CLASS} ${show ? INPUT_ERROR_CLASS : ''}`;
}

export function FieldHint({ formik, name }: { formik: FormikLite; name: string }) {
  const show =
    Boolean(formik.touched[name] || formik.submitCount > 0) &&
    typeof formik.errors[name] === 'string';
  if (!show) return null;
  return <p className="mt-1 text-xs font-medium text-error">{String(formik.errors[name])}</p>;
}

export function ValidationBanner({
  items,
  apiError,
  title = 'Revisa los datos del formulario',
}: {
  items: Array<{ key: string; label: string; msg: string }>;
  apiError?: string;
  title?: string;
}) {
  if (!items.length && !apiError) return null;
  return (
    <div className="rounded-lg border border-error-container bg-error-container/30 px-3 py-2 text-body-sm text-error">
      <p className="font-semibold">{title}</p>
      {apiError ? <p className="mt-1">{apiError}</p> : null}
      {items.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {items.map((e) => (
            <li key={e.key}>
              {e.label}: {e.msg}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
