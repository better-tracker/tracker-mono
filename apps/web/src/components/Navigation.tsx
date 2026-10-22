import { NavLink } from 'react-router';
import { cn } from './ui/classes';

const links = [
  ['/', 'Today'],
  ['/projects', 'Projects'],
  ['/tasks', 'Tasks'],
  ['/profile', 'Profile'],
] as const;

export function Navigation({ bottom = false }: { bottom?: boolean }) {
  return (
    <nav
      aria-label={bottom ? 'Mobile navigation' : 'Main navigation'}
      className={cn(
        'items-center justify-between',
        bottom
          ? 'mt-16 mb-5 hidden border-t border-black bg-paper py-4 max-desktop:flex'
          : 'flex gap-15 pr-[70px] desktop:max-wide:gap-8 desktop:max-wide:pr-0 max-desktop:hidden',
      )}
    >
      {links.map(([to, label]) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'font-semibold uppercase',
              bottom
                ? 'min-w-0 flex-1 border-[1.5px] border-transparent px-[9px] py-[18px] text-center text-[11.5px] tracking-[0.02em] max-phone:px-[5px] max-phone:text-[10.5px]'
                : 'relative text-[14px] tracking-[0.08em]',
              isActive &&
                (bottom
                  ? 'border-black'
                  : "after:absolute after:right-0 after:-bottom-3 after:left-0 after:border-b-2 after:border-black after:content-['']"),
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
