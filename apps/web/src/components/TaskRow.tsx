import { Link } from 'react-router';
import { dateLabel } from '../data/dates';
import type { DemoTask } from '../data/types';
import { useWorkspace } from '../features/workspace-context';
import { Status } from './UI';

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
    <article className="task-row">
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
      <div className="task-row-content">
        <Link className="task-title" to={`/tasks/${task.id}`}>
          {task.title}
        </Link>
        <Link
          className="eyebrow task-project"
          to={`/projects/${task.projectId}`}
        >
          {project?.name}
        </Link>
        <Status status={task.status} />
      </div>
      <span className="task-time">
        {showDate && task.dueDate && <small>{dateLabel(task.dueDate)}</small>}
        {task.dueTime || (task.dueDate ? 'End of day' : 'No deadline')}
      </span>
    </article>
  );
}
