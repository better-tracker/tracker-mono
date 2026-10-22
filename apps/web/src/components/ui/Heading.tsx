import type { ReactNode } from 'react';
import { cn } from './classes';
import { Eyebrow } from './Typography';

type HeadingProps = {
  title: string;
  subtitle: string;
  aside?: ReactNode;
  mobileTitle?: string;
  mobileSubtitle?: string;
  variant?: 'default' | 'today';
};

export function Heading({
  title,
  subtitle,
  aside,
  mobileTitle,
  mobileSubtitle,
  variant = 'default',
}: HeadingProps) {
  return (
    <header
      className={cn(
        'flex items-start justify-between gap-[30px] border-b-[6px] border-black pt-[30px] pb-4',
        'max-desktop:relative max-desktop:border-b-4 max-desktop:pb-[26px]',
        variant === 'today' && 'max-desktop:pb-9',
      )}
    >
      <div>
        <h1
          className={cn(
            '-ml-2 wrap-anywhere text-[100px]/[1] desktop:max-wide:text-[80px]/[1]',
            'max-desktop:-ml-[3px] max-desktop:text-[56px]/[1.05] max-phone:text-[49px]/[1.05]',
            variant === 'today' &&
              'text-[112px]/[1] max-desktop:text-[72px]/[1.05]',
          )}
        >
          {mobileTitle ? (
            <>
              <span className="max-desktop:hidden">{title}</span>
              <span className="hidden max-desktop:block">{mobileTitle}</span>
            </>
          ) : (
            title
          )}
        </h1>
        <Eyebrow className="mt-[18px] max-desktop:mt-[22px] max-desktop:text-[13px]/[1.4]">
          {mobileSubtitle ? (
            <>
              <span className="max-desktop:hidden">{subtitle}</span>
              <span className="hidden max-desktop:block">{mobileSubtitle}</span>
            </>
          ) : (
            subtitle
          )}
        </Eyebrow>
      </div>
      {aside}
    </header>
  );
}
