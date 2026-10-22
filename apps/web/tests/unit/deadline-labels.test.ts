import { describe, expect, it } from 'vitest';
import {
  formatDeadline,
  formatDeadlineTime,
  isValidDateOnly,
} from '../../src/data/dates';

describe('deadline labels', () => {
  it("preserves each screen's empty and end-of-day labels", () => {
    expect(formatDeadline({ dueDate: '', dueTime: '' })).toBe('No deadline');
    expect(
      formatDeadline(
        { dueDate: '', dueTime: '' },
        { noDeadline: 'No parent deadline' },
      ),
    ).toBe('No parent deadline');
    expect(
      formatDeadline(
        { dueDate: '2026-10-06', dueTime: '' },
        { endOfDay: 'end of day' },
      ),
    ).toBe('06 Oct / end of day');
    expect(formatDeadlineTime({ dueDate: '2026-10-06', dueTime: '' })).toBe(
      'End of day',
    );
    expect(formatDeadlineTime({ dueDate: '', dueTime: '' })).toBe(
      'No deadline',
    );
  });

  it("uses the caller's local date for Today and preserves explicit times", () => {
    const task = { dueDate: '2026-10-06', dueTime: '11:00' };
    expect(formatDeadline(task, { today: '2026-10-06', uppercase: true })).toBe(
      'TODAY / 11:00',
    );
    expect(formatDeadline(task, { today: '2026-10-05', uppercase: true })).toBe(
      '06 OCT / 11:00',
    );
    expect(formatDeadlineTime(task)).toBe('11:00');
  });

  it('accepts leap days and rejects dates that JavaScript rolls into another month', () => {
    expect(isValidDateOnly('2028-02-29')).toBe(true);
    expect(isValidDateOnly('2026-02-29')).toBe(false);
    expect(isValidDateOnly('2026-02-30')).toBe(false);
    expect(isValidDateOnly('2026-13-01')).toBe(false);
  });
});
