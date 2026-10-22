import type { TaskStatus } from '../../data/types';
import { cn } from './classes';

const colors: Record<TaskStatus, string> = {
  'To do': 'border-l-line',
  'In progress': 'border-l-progress',
  Complete: 'border-l-complete',
};

export function Status({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        'status inline-block border-l-[4px] border-solid border-l-line pl-[7px] text-[12px] font-semibold',
        'leading-[1.2] tracking-[0.04em] uppercase',
        colors[status],
      )}
    >
      {status}
    </span>
  );
}
