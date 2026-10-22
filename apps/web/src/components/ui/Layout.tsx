import type { ComponentProps } from 'react';
import { cn } from './classes';

export function Actions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'actions flex items-center gap-[14px] flex-wrap [&_button]:min-h-[46px] [&_button]:py-3',
        '[&_button]:px-5 [&_.button]:min-h-[46px] [&_.button]:py-3 [&_.button]:px-5',
        className,
      )}
      {...props}
    />
  );
}

export function SectionTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'section-title flex items-center justify-between gap-3 max-desktop:[&_.eyebrow]:text-[13px]',
        className,
      )}
      {...props}
    />
  );
}

export function FormLayout({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'form-layout grid grid-cols-[minmax(0,_940fr)_minmax(0,_450fr)] gap-[46px] pt-[50px]',
        'desktop:max-wide:gap-[30px]',
        'max-desktop:block max-desktop:pt-11',
        className,
      )}
      {...props}
    />
  );
}

export function FormActions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'form-actions flex justify-between border-t-[1px] border-solid border-t-line mt-[30px] pt-[26px] gap-5',
        '[&_.cancel]:min-w-[178px] [&_button[type=submit]]:min-w-67',
        'desktop:max-wide:[&_button[type=submit]]:min-w-50',
        'max-desktop:flex-col-reverse max-desktop:gap-4 max-desktop:border-0 max-desktop:mt-11',
        'max-desktop:pt-0 max-desktop:px-0 max-desktop:pb-7 max-desktop:[&_button[type=submit]]:min-h-15',
        'max-desktop:[&_button[type=submit]]:w-full max-desktop:[&_.cancel]:w-full',
        className,
      )}
      {...props}
    />
  );
}

export function ContextPanel({ className, ...props }: ComponentProps<'aside'>) {
  return (
    <aside
      className={cn(
        'context-panel min-w-0 [&_>_h2.eyebrow]:py-[18px] [&_>_h2.eyebrow]:px-0',
        '[&_>_h2.eyebrow]:border-b-[2px] [&_>_h2.eyebrow]:border-solid [&_>_h2.eyebrow]:border-b-black',
        '[&_>_h2.eyebrow]:mb-[26px] [&_>_h3:not(.eyebrow)]:text-[26px] [&_>_h3:not(.eyebrow)]:my-[14px]',
        '[&_>_h3:not(.eyebrow)]:mx-0 [&_>_p:not(.eyebrow)]:leading-[1.5] [&_>_p:not(.eyebrow)]:mb-[30px]',
        'max-desktop:hidden max-desktop:[&.detail-context]:block max-desktop:[&.detail-context]:mt-11',
        className,
      )}
      {...props}
    />
  );
}

export function ContextBox({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'context-box border-[1.5px] border-solid border-black py-5 px-6 mb-9 [&_h3]:text-[32px]',
        '[&_h3]:tracking-[-0.04em] [&_h3]:mt-[6px] [&_h3]:mx-0 [&_h3]:mb-[10px]',
        '[&_p:not(.eyebrow)]:text-[18px] [&_p:not(.eyebrow)]:leading-[1.5]',
        className,
      )}
      {...props}
    />
  );
}

export function SummaryList({ className, ...props }: ComponentProps<'dl'>) {
  return (
    <dl
      className={cn(
        'summary-list mt-0 mx-0 mb-10 text-[14px] font-semibold tracking-[0.05em] uppercase [&_>_div]:flex',
        '[&_>_div]:justify-between [&_>_div]:gap-6 [&_>_div]:py-6 [&_>_div]:px-0 [&_>_div]:border-b-[1px]',
        '[&_>_div]:border-solid [&_>_div]:border-b-line [&_dd]:text-right [&_dd]:m-0',
        className,
      )}
      {...props}
    />
  );
}

export function CheckLabel({ className, ...props }: ComponentProps<'label'>) {
  return (
    <label
      className={cn(
        'check-label flex items-center gap-[14px] leading-[1.4]',
        className,
      )}
      {...props}
    />
  );
}

export function Toolbar({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'toolbar flex items-center justify-between gap-6 my-[38px] mx-0',
        'max-desktop:items-start max-desktop:flex-col max-desktop:my-[30px] max-desktop:mx-0',
        'max-desktop:[&_>_.button]:w-full max-desktop:[&_>_button]:w-full',
        className,
      )}
      {...props}
    />
  );
}

export function FormRow({
  columns = 2,
  className,
  ...props
}: ComponentProps<'div'> & { columns?: 2 | 3 }) {
  return (
    <div
      className={cn(
        'form-row grid grid-cols-2 gap-10 desktop:max-wide:gap-5 max-desktop:block',
        columns === 3 && 'grid-cols-3',
        className,
      )}
      {...props}
    />
  );
}
