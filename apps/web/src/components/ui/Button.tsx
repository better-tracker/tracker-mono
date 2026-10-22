import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { cn } from './classes';

const base = cn(
  'border-[1.5px] border-solid border-black bg-transparent rounded-[0] min-h-14 py-[15px] px-7',
  'text-[14px] font-semibold tracking-[0.08em] text-center no-underline cursor-pointer inline-flex',
  'items-center justify-center [&:hover]:bg-hover [&:hover]:no-underline',
  'motion-safe:[transition:background-color_120ms_ease]',
);
const variants = {
  outline: '',
  text: 'text-button min-h-auto p-0 border-0 text-[length:inherit] font-normal tracking-[inherit] underline underline-offset-[5px] [&:hover]:bg-transparent',
  danger: 'bg-error',
};
type Variant = keyof typeof variants;

export function Button({
  className,
  variant = 'outline',
  ...props
}: ComponentProps<'button'> & { variant?: Variant }) {
  return (
    <button
      className={cn('button', base, variants[variant], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return <Link className={cn('button', base, className)} {...props} />;
}

export function ButtonAnchor({ className, ...props }: ComponentProps<'a'>) {
  return <a className={cn('button', base, className)} {...props} />;
}
