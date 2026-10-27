import type { DemoSubtask, DemoTask, Workspace } from '../../data/types';
import { type Selection, taskColor } from './graph';

export function GraphList({
  tasks,
  workspace,
  selection,
  onSelect,
  now,
}: {
  tasks: DemoTask[];
  workspace: Workspace;
  selection: Selection;
  onSelect: (selection: Selection) => void;
  now: Date;
}) {
  const projects = new Map(
    workspace.projects.map((project) => [project.id, project.name]),
  );
  const subtasks = new Map<string, DemoSubtask[]>();
  for (const subtask of workspace.subtasks) {
    const siblings = subtasks.get(subtask.taskId) ?? [];
    siblings.push(subtask);
    subtasks.set(subtask.taskId, siblings);
  }
  return (
    <ol className="graph-list" aria-label="Graph task results">
      {tasks.map((task) => (
        <li key={task.id}>
          <span className="graph-kicker">{projects.get(task.projectId)}</span>
          <button
            type="button"
            className="graph-list-task"
            aria-pressed={selection.taskId === task.id}
            onClick={() => onSelect({ taskId: task.id, subtaskId: null })}
          >
            <span
              className="graph-dot"
              style={{
                background: taskColor(task, now, workspace.profile.timezone),
              }}
            />
            {task.title}
          </button>
          <span className="graph-muted">{task.status}</span>
          {!!subtasks.get(task.id)?.length && (
            <ul>
              {subtasks.get(task.id)!.map((subtask) => (
                <li key={subtask.id}>
                  <button
                    type="button"
                    aria-pressed={selection.subtaskId === subtask.id}
                    onClick={() =>
                      onSelect({ taskId: task.id, subtaskId: subtask.id })
                    }
                  >
                    <span aria-label={subtask.completed ? 'Complete' : 'To do'}>
                      {subtask.completed ? '✓' : '·'}
                    </span>{' '}
                    {subtask.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
