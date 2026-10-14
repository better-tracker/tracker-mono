import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
} from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';
import type { TaskStatus } from '../data/types';

export function Heading({
  title,
  subtitle,
  aside,
  mobileTitle,
  mobileSubtitle,
}: {
  title: string;
  subtitle: string;
  aside?: ReactNode;
  mobileTitle?: string;
  mobileSubtitle?: string;
}) {
  return (
    <header
      className={`page-heading${title === 'TODAY.' ? ' today-heading' : ''}`}
    >
      <div>
        <h1>
          {mobileTitle ? (
            <>
              <span className="desktop-only">{title}</span>
              <span className="mobile-only">{mobileTitle}</span>
            </>
          ) : (
            title
          )}
        </h1>
        <p className="eyebrow">
          {mobileSubtitle ? (
            <>
              <span className="desktop-only">{subtitle}</span>
              <span className="mobile-only">{mobileSubtitle}</span>
            </>
          ) : (
            subtitle
          )}
        </p>
      </div>
      {aside}
    </header>
  );
}
export function Field({
  label,
  children,
  hint,
  required = false,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  const connect = (nodes: ReactNode): ReactNode =>
    Children.map(nodes, (node) => {
      if (!isValidElement(node)) return node;
      const element = node as ReactElement<{
        children?: ReactNode;
        id?: string;
        'aria-describedby'?: string;
      }>;
      if (['input', 'select', 'textarea'].includes(String(element.type)))
        return cloneElement(element, {
          id,
          'aria-describedby': hint ? `${id}-hint` : undefined,
        });
      return element.props.children
        ? cloneElement(element, { children: connect(element.props.children) })
        : element;
    });
  return (
    <div className="field">
      <label htmlFor={id} className="eyebrow">
        {label}
        {required ? ' *' : ''}
      </label>
      {connect(children)}
      {hint && (
        <span id={`${id}-hint`} className="hint">
          {hint}
        </span>
      )}
    </div>
  );
}
export function Status({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`status status-${status === 'Complete' ? 'complete' : status === 'In progress' ? 'progress' : 'todo'}`}
    >
      {status}
    </span>
  );
}
export function Progress({ value }: { value: number }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Project completion"
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
export function Missing() {
  return (
    <>
      <Heading
        title="NOT HERE."
        subtitle="THIS PAGE OR RECORD COULD NOT BE FOUND"
      />
      <Empty>
        <p>Let’s find your next step.</p>
        <Link className="button" to="/">
          Return to Today →
        </Link>
      </Empty>
    </>
  );
}
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-top">
        <h2 id={titleId}>{title}</h2>
        <button aria-label="Close dialog" onClick={onClose}>
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  message,
  busy,
  onConfirm,
  onClose,
  error,
}: {
  title: string;
  message: string;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
  error?: string;
}) {
  return (
    <Dialog title={title} onClose={onClose}>
      <p>{message}</p>
      {error && (
        <p className="feedback error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button className="danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : 'Confirm deletion'}
        </button>
      </div>
    </Dialog>
  );
}
