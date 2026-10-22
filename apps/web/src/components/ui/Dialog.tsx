import { cn } from './classes';
import { Button } from './Button';
import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

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
      className={cn(
        'max-w-150 w-[calc(100%_-_40px)] text-black bg-paper border-2 border-solid border-black p-8',
        'backdrop:bg-[#0006] [&>p]:leading-[1.6] [&>p]:mb-7',
        'max-desktop:p-6 max-desktop:[&_.field]:mb-[26px]',
      )}
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div
        className={cn(
          'dialog-top flex items-center justify-between gap-5 mb-[30px] [&_h2]:text-[32px]',
          '[&_h2]:tracking-[-0.04em] [&_>_button]:min-h-10 [&_>_button]:py-1 [&_>_button]:px-3',
          '[&_>_button]:text-[26px]',
          'max-desktop:[&_h2]:text-[27px]',
        )}
      >
        <h2 id={titleId}>{title}</h2>
        <Button aria-label="Close dialog" onClick={onClose}>
          ×
        </Button>
      </div>
      {children}
    </dialog>
  );
}
