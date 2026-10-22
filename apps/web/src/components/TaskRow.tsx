import { Status } from './ui';
import { cn } from './ui/classes';
import { Link } from 'react-router';
import { dateLabel, formatDeadlineTime } from '../data/dates';
import type { DemoTask } from '../data/types';
import { useWorkspace } from '../features/workspace-context';

export function TaskRow({
  task,
  showDate = false,
}: {
  task: DemoTask;
  showDate?: boolean;
}) {
  const { workspace, source, run, busy } = useWorkspace();
  const project = workspace.projects.find(
    (value) => value.id === task.projectId,
  );
  return (
    <article
      className={cn(
        'task-row flex items-start gap-[18px] pt-[26px] px-0 pb-[6px] border-b-[1px] border-solid',
        'border-b-line relative [&_>_input]:mt-1 [&_.status]:self-start [&_.status]:m-0',
        'max-desktop:pt-[22px] max-desktop:px-0 max-desktop:pb-[26px] max-desktop:min-h-37',
        'max-desktop:gap-[14px] max-desktop:[&_.status]:text-[11.5px] max-desktop:[&_.status]:mt-[14px]',
      )}
    >
      <input
        aria-label={`Complete ${task.title}`}
        type="checkbox"
        checked={task.status === 'Complete'}
        disabled={busy}
        onChange={() =>
          void run(
            () =>
              source.updateTask(task.id, {
                ...task,
                status: task.status === 'Complete' ? 'To do' : 'Complete',
              }),
            'Task updated.',
          )
        }
      />
      <div className="task-row-content flex flex-col min-w-0 gap-2 flex-[1] max-desktop:pb-0">
        <Link
          className="task-title text-[27px] tracking-[-0.04em] leading-[1.2] wrap-anywhere max-desktop:text-[21px] max-desktop:leading-[1.35]"
          to={`/tasks/${task.id}`}
        >
          {task.title}
        </Link>
        <Link
          className={cn(
            'eyebrow task-project text-[14px] tracking-[0.08em] font-semibold leading-[1.4] uppercase text-[12px]/[1.4]',
            'max-desktop:text-[11.5px]',
          )}
          to={`/projects/${task.projectId}`}
        >
          {project?.name}
        </Link>
        <Status status={task.status} />
      </div>
      <span
        className={cn(
          'task-time text-[30px] tracking-[-0.04em] whitespace-nowrap [&_small]:block [&_small]:text-[13px]',
          '[&_small]:leading-[1.6] [&_small]:text-right',
          'max-desktop:absolute max-desktop:bottom-[22px] max-desktop:right-0 max-desktop:text-[25px]',
          'max-desktop:[&_small]:inline max-desktop:[&_small]:mr-2 max-desktop:[&_small]:text-[12px]',
        )}
      >
        {showDate && task.dueDate && <small>{dateLabel(task.dueDate)}</small>}
        {formatDeadlineTime(task)}
      </span>
    </article>
  );
}
