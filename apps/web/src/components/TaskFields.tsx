import { Field } from './ui';
import { cn } from './ui/classes';
import { TASK_PRIORITIES } from '../data/constants';
import type { Deadline, Priority } from '../data/types';

export function Assignee({
  value,
  onChange,
  name,
}: {
  value: string;
  onChange: (value: string) => void;
  name: string;
}) {
  const options = [
    ...new Set(['Unassigned', name, 'Ben Morgan', value].filter(Boolean)),
  ];
  return (
    <Field label="Assigned to">
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </Field>
  );
}
export function PriorityField({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (value: Priority) => void;
}) {
  return (
    <Field label="Priority">
      <span
        className={cn(
          "relative block [&::before]:content-[''] [&::before]:absolute [&::before]:w-2 [&::before]:h-2",
          '[&::before]:left-4 [&::before]:top-6 [&::before]:pointer-events-none [&::before]:bg-progress',
          '[&_select]:pl-[34px]',
          value === 'High' && '[&::before]:bg-urgent',
          value === 'Low' && '[&::before]:bg-complete',
        )}
      >
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as Priority)}
        >
          {TASK_PRIORITIES.map((priority) => (
            <option key={priority}>{priority}</option>
          ))}
        </select>
      </span>
    </Field>
  );
}
export function DeadlineFields({
  value,
  onChange,
}: {
  value: Deadline;
  onChange: (value: Deadline) => void;
}) {
  return (
    <>
      <Field label="Due date">
        <input
          type="date"
          value={value.dueDate}
          onChange={(event) =>
            onChange({ ...value, dueDate: event.target.value })
          }
        />
      </Field>
      <Field label="Due time">
        <input
          type="time"
          value={value.dueTime}
          onChange={(event) =>
            onChange({ ...value, dueTime: event.target.value })
          }
        />
      </Field>
    </>
  );
}
