import { Field } from './UI';
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
      <span className={`priority-field priority-${value.toLowerCase()}`}>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as Priority)}
        >
          {['Low', 'Medium', 'High'].map((priority) => (
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
