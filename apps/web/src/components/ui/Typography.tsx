import type { HTMLAttributes } from 'react';
import { cn } from './classes';

type TextProps = HTMLAttributes<HTMLElement> & {
  as?: 'p' | 'span' | 'h2' | 'h3';
};

export function Eyebrow({ as: Tag = 'p', className, ...props }: TextProps) {
  return (
    <Tag
      className={cn(
        'eyebrow text-[14px] tracking-[0.08em] font-semibold leading-[1.4] uppercase',
        className,
      )}
      {...props}
    />
  );
}

export function Hint({ as: Tag = 'span', className, ...props }: TextProps) {
  return (
    <Tag
      className={cn(
        'hint text-[13px] leading-[1.6] tracking-[-0.01em]',
        className,
      )}
      {...props}
    />
  );
}

export function Feedback({
  error = false,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { error?: boolean }) {
  return (
    <p
      className={cn(
        'feedback text-[15px] py-[14px] px-[18px] border-[1px] border-solid border-black bg-success my-5 mx-0 leading-[1.5]',
        error && 'bg-error',
        className,
      )}
      {...props}
    />
  );
}
