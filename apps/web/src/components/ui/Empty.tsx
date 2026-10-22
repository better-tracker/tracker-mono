import type { ReactNode } from 'react';

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty border-[1px] border-solid border-line p-[34px] my-6 mx-0 leading-[1.5] [&_p]:mb-[22px]">
      {children}
    </div>
  );
}
