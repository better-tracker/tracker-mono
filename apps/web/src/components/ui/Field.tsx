import { cn } from './classes';
import { Hint } from './Typography';
import { Children, cloneElement, isValidElement, useId } from 'react';
import type { ReactElement, ReactNode } from 'react';

export function Field({
  label,
  children,
  hint,
  required = false,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  const connect = (nodes: ReactNode): ReactNode =>
    Children.map(nodes, (node) => {
      if (!isValidElement(node)) return node;
      const element = node as ReactElement<{
        children?: ReactNode;
        id?: string;
        'aria-describedby'?: string;
      }>;
      if (['input', 'select', 'textarea'].includes(String(element.type)))
        return cloneElement(element, {
          id,
          'aria-describedby': hint ? `${id}-hint` : undefined,
        });
      return element.props.children
        ? cloneElement(element, { children: connect(element.props.children) })
        : element;
    });
  return (
    <div
      className={cn(
        'field flex flex-col gap-4 min-w-0 mb-8 [&_.hint]:mt-[-4px]',
        'max-desktop:gap-4 max-desktop:mb-6 max-desktop:[&_.eyebrow]:text-[14px]',
        'max-desktop:[&_.hint]:text-[15px]',
      )}
    >
      <label
        htmlFor={id}
        className="eyebrow text-[14px] tracking-[0.08em] font-semibold leading-[1.4] uppercase"
      >
        {label}
        {required ? ' *' : ''}
      </label>
      {connect(children)}
      {hint && <Hint id={`${id}-hint`}>{hint}</Hint>}
    </div>
  );
}
