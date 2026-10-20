import { Link } from 'react-router';
import {
  dashboard,
  dateLabel,
  projectProgress,
  weekNumber,
} from '../data/dates';
import { useWorkspace } from '../features/workspace-context';
import { Empty, Heading, Progress } from '../components/UI';
import { TaskRow } from '../components/TaskRow';

export function Today() {
  const { workspace, source, run, busy, now } = useWorkspace();
  const { today, overdue, done, next, clock } = dashboard(workspace, now);
  const nextSubtasks = workspace.subtasks.filter(
    (subtask) => subtask.taskId === next?.id,
  );
  const nextProject = workspace.projects.find(
    (project) => project.id === next?.projectId,
  );
  const greeting =
    Number(clock.time.slice(0, 2)) < 12
      ? 'MORNING'
      : Number(clock.time.slice(0, 2)) < 18
        ? 'AFTERNOON'
        : 'EVENING';
  return (
    <>
      <Heading
        title="TODAY."
        subtitle={`${dateLabel(clock.date, { weekday: 'long' })} / ${dateLabel(clock.date, { day: '2-digit', month: 'long', year: 'numeric' })}`.toUpperCase()}
        mobileSubtitle={`${dateLabel(clock.date, { weekday: 'short' })} / ${dateLabel(clock.date, { day: '2-digit', month: 'short', year: 'numeric' })}`.toUpperCase()}
        aside={
          <div className="today-heading-aside">
            <span className="week">
              W{weekNumber(clock.date, workspace.profile.weekStartsOn)}
            </span>
            <p className="eyebrow">
              GOOD {greeting}, {workspace.profile.firstName.toUpperCase()}.
            </p>
          </div>
        }
      />
      <section className="today-signals" aria-label="Today summary">
        <div className="stat-group">
          {[
            ['DUE TODAY', today.length],
            ['OVERDUE', overdue.length],
            ['DONE TODAY', done.length],
          ].map(([label, number]) => (
            <div className="stat" key={label}>
              <span className="eyebrow">{label}</span>
              <strong>
                {String(number).padStart(2, '0')}
                {label === 'OVERDUE' && Number(number) > 0 && <i />}
              </strong>
            </div>
          ))}
        </div>
        <Link className="button" to="/tasks/new">
          + NEW TASK
        </Link>
      </section>
      <div className="dashboard-grid">
        <section className="deadline-ledger">
          {overdue.length > 0 && (
            <div className="overdue-box">
              <p className="eyebrow">
                {String(overdue.length).padStart(2, '0')} OVERDUE / NEEDS
                ATTENTION
              </p>
              {overdue.slice(0, 4).map((task) => (
                <Link key={task.id} to={`/tasks/${task.id}`}>
                  <span>{task.title}</span>
                  <span className="eyebrow">
                    {dateLabel(task.dueDate).toUpperCase()} ↗
                  </span>
                </Link>
              ))}
            </div>
          )}
          <div className="section-title">
            <h2 className="eyebrow">01 / TODAY’S DEADLINES</h2>
            <span className="eyebrow">
              {String(today.length).padStart(2, '0')} TASKS
            </span>
          </div>
          {today.length ? (
            today.map((task) => <TaskRow task={task} key={task.id} />)
          ) : (
            <Empty>No deadlines today. Make room for your next task.</Empty>
          )}
          <Link className="view-all" to="/tasks">
            VIEW ALL TASKS ↗
          </Link>
        </section>
        <aside className="next-action">
          <div className="section-title">
            <h2 className="eyebrow">02 / START HERE</h2>
            <span className="eyebrow deadline-accent">NEXT DEADLINE</span>
          </div>
          {next ? (
            <section className="next-card">
              <p className="eyebrow">
                {next.dueTime || 'NO TIME SET'} / {next.priority.toUpperCase()}{' '}
                PRIORITY
              </p>
              <h2>{next.title}</h2>
              <p className="eyebrow">
                {nextProject?.name}
                <span className="desktop-only">
                  {' '}
                  / {
                    nextSubtasks.filter((item) => item.completed).length
                  } OF {nextSubtasks.length} STEPS DONE
                </span>
              </p>
              <div className="desktop-subtasks">
                {nextSubtasks.map((subtask) => (
                  <label className="check-label" key={subtask.id}>
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      disabled={busy}
                      onChange={() =>
                        void run(
                          () =>
                            source.updateSubtask(subtask.id, {
                              ...subtask,
                              completed: !subtask.completed,
                            }),
                          'Subtask updated.',
                        )
                      }
                    />
                    {subtask.title}
                  </label>
                ))}
              </div>
              <p className="mobile-only next-subtask-count">
                {nextSubtasks.filter((item) => item.completed).length} of{' '}
                {nextSubtasks.length} subtasks complete
              </p>
              <Link className="button" to={`/tasks/${next.id}`}>
                OPEN TASK →
              </Link>
            </section>
          ) : (
            <Empty>Everything is complete. A little space to focus.</Empty>
          )}
          <section className="projects-motion">
            <h2 className="eyebrow">03 / PROJECTS IN MOTION</h2>
            {workspace.projects.length ? (
              workspace.projects.slice(0, 2).map((project) => (
                <div key={project.id}>
                  <Link to={`/projects/${project.id}`}>
                    <span>{project.name}</span>
                    <span>{projectProgress(workspace, project.id)}%</span>
                  </Link>
                  <Progress value={projectProgress(workspace, project.id)} />
                </div>
              ))
            ) : (
              <Empty>
                <Link to="/projects">Create your first project →</Link>
              </Empty>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
