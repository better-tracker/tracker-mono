# Web styling

Use the components exported from this folder for shared UI. Buttons, fields,
headings, dialogs, feedback, and form layouts keep their Tailwind classes beside
their markup. Page-specific layout classes stay in the page that owns them.

```tsx
import { Button, Field, FormActions, FormRow } from '../components/ui';

<FormRow>
  <Field label="Task title" required>
    <input required value={title} onChange={onTitleChange} />
  </Field>
</FormRow>
<FormActions>
  <Button type="submit">Save task</Button>
</FormActions>
```

- Reuse `Button` variants (`outline`, `text`, `danger`) and `ButtonLink` for
  navigation styled as a button. Use `className` for a local override; `cn`
  merges conflicting Tailwind classes.
- Use semantic colors such as `bg-paper`, `border-line`, and `bg-complete`.
  Change shared colors and breakpoints in `src/styles/theme.css`.
- `max-desktop:` covers widths below 900px, `desktop:max-wide:` covers
  900–1250px, and `max-phone:` covers widths below 391px.
- Keep explicit line heights when overriding typography, for example
  `text-[12px]/[1.4]`. A font-size override can replace a component's typography
  defaults during class merging.
- Some components expose class hooks such as `field`, `eyebrow`, and `button`
  for scoped descendant utilities. These hooks have no global CSS rules.
- Keep global CSS limited to native element defaults, focus behavior, and
  theme tokens. Use inline styles for values calculated at runtime, such as
  progress width.

Run `pnpm --filter @project-tracker/web test:e2e` after changing shared styles.
It checks workflows and captures five screens at four responsive widths.
