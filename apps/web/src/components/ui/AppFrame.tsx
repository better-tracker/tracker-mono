import type { ComponentProps } from 'react';
import { cn } from './classes';

export function AppFrame({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'mx-auto max-w-400 py-0 pr-15 pl-26 desktop:max-wide:px-10',
        'max-desktop:pr-8 max-desktop:pl-10 max-phone:px-6',
        className,
      )}
      {...props}
    />
  );
}

export function SiteHeader({ className, ...props }: ComponentProps<'header'>) {
  return (
    <header
      className={cn(
        'flex items-center justify-between border-b-[1.5px] border-black pt-11 pb-[14px]',
        'max-desktop:pt-[30px] max-desktop:pb-3',
        className,
      )}
      {...props}
    />
  );
}

export function SiteFooter({ className, ...props }: ComponentProps<'footer'>) {
  return (
    <footer
      className={cn(
        'page-footer mt-10 flex justify-between gap-6 border-t-[1.5px] border-black pt-6 pb-[38px]',
        'text-[12px]/[1.4] font-semibold tracking-[0.08em] uppercase max-desktop:hidden',
        className,
      )}
      {...props}
    />
  );
}
