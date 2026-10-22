import {
  dashboard,
  getProjectSummary,
  getSubtaskSummary,
} from '../data/workspace-selectors';
import {
  ButtonLink,
  CheckLabel,
  Empty,
  Eyebrow,
  Heading,
  Progress,
  SectionTitle,
} from '../components/ui';
import { cn } from '../components/ui/classes';
import { Link } from 'react-router';
import { dateLabel, weekNumber } from '../data/dates';
import { useWorkspace } from '../features/workspace-context';
import { TaskRow } from '../components/TaskRow';

export function Today() {
  const { workspace, source, run, busy, now } = useWorkspace();
  const { today, overdue, done, next, clock } = dashboard(workspace, now);
  const { subtasks: nextSubtasks, completed: completedSubtasks } =
    getSubtaskSummary(workspace, next?.id);
  const activeProjects = workspace.projects.slice(0, 2).map((project) => ({
    project,
    progress: getProjectSummary(workspace, project.id).progress,
  }));
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
        variant="today"
        subtitle={`${dateLabel(clock.date, { weekday: 'long' })} / ${dateLabel(clock.date, { day: '2-digit', month: 'long', year: 'numeric' })}`.toUpperCase()}
        mobileSubtitle={`${dateLabel(clock.date, { weekday: 'short' })} / ${dateLabel(clock.date, { day: '2-digit', month: 'short', year: 'numeric' })}`.toUpperCase()}
        aside={
          <div
            className={cn(
              'today-heading-aside text-right [&_.eyebrow]:mt-5',
              'max-desktop:absolute max-desktop:bottom-9 max-desktop:right-0 max-desktop:[&_.week]:text-[13px]',
              'max-desktop:[&_.week]:font-semibold max-desktop:[&_.week]:tracking-[0.05em]',
              'max-desktop:[&_.eyebrow]:hidden',
            )}
          >
            <span className="week tracking-[-0.06em] block text-[82px] leading-[1.2]">
              W{weekNumber(clock.date, workspace.profile.weekStartsOn)}
            </span>
            <Eyebrow>
              GOOD {greeting}, {workspace.profile.firstName.toUpperCase()}.
            </Eyebrow>
          </div>
        }
      />
      <section
        className={cn(
          'today-signals flex justify-between items-center py-[26px] px-0 border-b-[2px] border-solid',
          'border-b-black gap-10 [&_>_.button]:w-125 [&_>_.button]:min-h-16',
          'desktop:max-wide:[&_>_.button]:w-[33%]',
          'max-desktop:flex-col max-desktop:pt-[34px] max-desktop:px-0 max-desktop:pb-0 max-desktop:border-0',
          'max-desktop:gap-7 max-desktop:[&_>_.button]:w-full max-desktop:[&_>_.button]:min-h-15',
        )}
        aria-label="Today summary"
      >
        <div
          className={cn(
            'stat-group grid grid-cols-[repeat(3,_241px)]',
            'desktop:max-wide:flex desktop:max-wide:gap-[55px]',
            'max-desktop:flex max-desktop:w-full max-desktop:justify-between max-desktop:gap-[10px]',
          )}
        >
          {[
            ['DUE TODAY', today.length],
            ['OVERDUE', overdue.length],
            ['DONE TODAY', done.length],
          ].map(([label, number]) => (
            <div
              className={cn(
                'stat flex flex-col gap-2 [&_strong]:text-[66px] [&_strong]:font-normal [&_strong]:tracking-[-0.06em]',
                '[&_strong]:leading-[1] [&_strong]:relative [&_i]:inline-block [&_i]:w-2 [&_i]:h-[38px] [&_i]:ml-7',
                '[&_i]:bg-urgent',
                'max-desktop:[&_.eyebrow]:text-[11.5px] max-desktop:[&_strong]:text-[56px] max-desktop:[&_i]:hidden',
              )}
              key={label}
            >
              <Eyebrow as="span">{label}</Eyebrow>
              <strong>
                {String(number).padStart(2, '0')}
                {label === 'OVERDUE' && Number(number) > 0 && <i />}
              </strong>
            </div>
          ))}
        </div>
        <ButtonLink to="/tasks/new">+ NEW TASK</ButtonLink>
      </section>
      <div className="dashboard-grid grid grid-cols-[minmax(0,_888fr)_minmax(0,_500fr)] gap-12 mt-[26px] max-desktop:block max-desktop:mt-6">
        <section
          className={cn(
            'deadline-ledger pr-[42px] border-r-[1px] border-solid border-r-line min-w-0',
            '[&_>_.section-title]:border-b-[2px] [&_>_.section-title]:border-solid',
            '[&_>_.section-title]:border-b-black [&_>_.section-title]:pt-0 [&_>_.section-title]:px-0',
            '[&_>_.section-title]:pb-[14px]',
            'max-desktop:border-0 max-desktop:p-0 max-desktop:[&_>_.section-title]:pb-[18px]',
            'max-desktop:[&_>_.section-title_>_span]:hidden',
          )}
        >
          {overdue.length > 0 && (
            <div
              className={cn(
                'overdue-box bg-overdue border-[1.5px] border-solid border-black p-5 mb-[30px] [&_p]:mb-2 [&_a]:flex',
                '[&_a]:justify-between [&_a]:gap-5 [&_a]:p-0 [&_a]:text-[21px] [&_a_.eyebrow]:text-[13px]',
                '[&_a_.eyebrow]:whitespace-nowrap [&_a_.eyebrow]:self-center',
                'max-desktop:py-5 max-desktop:px-4 max-desktop:mb-11 max-desktop:[&_p]:text-[12px]',
                'max-desktop:[&_a]:block max-desktop:[&_a]:py-[10px] max-desktop:[&_a]:px-0',
                'max-desktop:[&_a]:text-[19px] max-desktop:[&_a_+_a]:border-t-[1px] max-desktop:[&_a_+_a]:border-solid',
                'max-desktop:[&_a_+_a]:border-t-black max-desktop:[&_a_.eyebrow]:block max-desktop:[&_a_.eyebrow]:mt-3',
                'max-desktop:[&_a_.eyebrow]:text-[12px]',
              )}
            >
              <Eyebrow>
                {String(overdue.length).padStart(2, '0')} OVERDUE / NEEDS
                ATTENTION
              </Eyebrow>
              {overdue.slice(0, 4).map((task) => (
                <Link key={task.id} to={`/tasks/${task.id}`}>
                  <span>{task.title}</span>
                  <Eyebrow as="span">
                    {dateLabel(task.dueDate).toUpperCase()} ↗
                  </Eyebrow>
                </Link>
              ))}
            </div>
          )}
          <SectionTitle>
            <Eyebrow as="h2">01 / TODAY’S DEADLINES</Eyebrow>
            <Eyebrow as="span">
              {String(today.length).padStart(2, '0')} TASKS
            </Eyebrow>
          </SectionTitle>
          {today.length ? (
            today.map((task) => <TaskRow task={task} key={task.id} />)
          ) : (
            <Empty>No deadlines today. Make room for your next task.</Empty>
          )}
          <Link
            className={cn(
              'view-all inline-block text-[14px] font-semibold tracking-[0.05em] mt-6',
              'max-desktop:flex max-desktop:justify-center max-desktop:items-center max-desktop:min-h-15',
              'max-desktop:border-[1.5px] max-desktop:border-solid max-desktop:border-black max-desktop:w-full',
              'max-desktop:mt-7',
            )}
            to="/tasks"
          >
            VIEW ALL TASKS ↗
          </Link>
        </section>
        <aside
          className={cn(
            'next-action min-w-0 [&_>_.section-title]:mt-3 [&_>_.section-title]:mx-0 [&_>_.section-title]:mb-4',
            'max-desktop:mt-11 max-desktop:[&_>_.section-title]:mb-6 max-desktop:[&_.deadline-accent]:text-[0]',
          )}
        >
          <SectionTitle>
            <Eyebrow as="h2">02 / START HERE</Eyebrow>
            <Eyebrow
              className={cn(
                "deadline-accent relative [&::after]:content-[''] [&::after]:w-6 [&::after]:h-1 [&::after]:absolute",
                '[&::after]:top-0 [&::after]:right-0 [&::after]:bg-deadline',
              )}
              as="span"
            >
              NEXT DEADLINE
            </Eyebrow>
          </SectionTitle>
          {next ? (
            <section
              className={cn(
                'next-card bg-next border-[1.5px] border-solid border-black pt-6 px-5 pb-4 [&_h2]:text-[43px]',
                '[&_h2]:leading-[1.08] [&_h2]:tracking-[-0.06em] [&_h2]:mt-2 [&_h2]:mx-0 [&_h2]:mb-5',
                '[&_h2]:wrap-anywhere [&_.eyebrow]:text-[12px] [&_>_.eyebrow:first-child]:text-[14px]',
                '[&_>_.button]:w-full [&_>_.button]:min-h-[46px] [&_>_.button]:py-[10px] [&_>_.button]:px-[14px]',
                '[&_>_.button]:bg-paper',
                'desktop:max-wide:[&_h2]:text-[36px]',
                'max-desktop:pt-6 max-desktop:px-4 max-desktop:pb-4 max-desktop:[&_h2]:text-[35px]',
                'max-desktop:[&_h2]:mb-5 max-desktop:[&_.eyebrow]:text-[11.5px]',
                'max-desktop:[&_>_.eyebrow:first-child]:text-[12px] max-desktop:[&_>_.button]:min-h-14',
              )}
            >
              <Eyebrow>
                {next.dueTime || 'NO TIME SET'} / {next.priority.toUpperCase()}{' '}
                PRIORITY
              </Eyebrow>
              <h2>{next.title}</h2>
              <Eyebrow>
                {nextProject?.name}
                <span className="desktop-only max-desktop:hidden">
                  {' '}
                  / {completedSubtasks} OF {nextSubtasks.length} STEPS DONE
                </span>
              </Eyebrow>
              <div className="desktop-subtasks my-[18px] mx-0 [&_.check-label]:my-3 [&_.check-label]:mx-0 max-desktop:hidden">
                {nextSubtasks.map((subtask) => (
                  <CheckLabel key={subtask.id}>
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
                  </CheckLabel>
                ))}
              </div>
              <p
                className={cn(
                  'mobile-only next-subtask-count hidden',
                  'max-desktop:block max-desktop:text-[18px] max-desktop:my-5 max-desktop:mx-0',
                  'max-desktop:border-l-[4px] max-desktop:border-solid max-desktop:border-l-[var(--complete)]',
                  'max-desktop:pl-2',
                )}
              >
                {completedSubtasks} of {nextSubtasks.length} subtasks complete
              </p>
              <ButtonLink to={`/tasks/${next.id}`}>OPEN TASK →</ButtonLink>
            </section>
          ) : (
            <Empty>Everything is complete. A little space to focus.</Empty>
          )}
          <section
            className={cn(
              'projects-motion mt-[38px] [&_>_h2]:border-b-[2px] [&_>_h2]:border-solid [&_>_h2]:border-b-black',
              '[&_>_h2]:pb-4 [&_>_h2]:mb-[18px] [&_>_div]:mb-[22px] [&_a]:flex [&_a]:justify-between [&_a]:gap-5',
              '[&_a]:text-[21px]',
              'max-desktop:mt-11 max-desktop:[&_>_h2]:pb-[18px] max-desktop:[&_>_div]:mt-6',
              'max-desktop:[&_>_div]:mx-0 max-desktop:[&_>_div]:mb-8 max-desktop:[&_a]:text-[19px]',
            )}
          >
            <Eyebrow as="h2">03 / PROJECTS IN MOTION</Eyebrow>
            {workspace.projects.length ? (
              activeProjects.map(({ project, progress }) => (
                <div key={project.id}>
                  <Link to={`/projects/${project.id}`}>
                    <span>{project.name}</span>
                    <span>{progress}%</span>
                  </Link>
                  <Progress value={progress} />
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
