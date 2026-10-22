import { Actions } from './Layout';
import { Feedback } from './Typography';
import { Button } from './Button';
import { Dialog } from './Dialog';

export function Confirm({
  title,
  message,
  busy,
  onConfirm,
  onClose,
  error,
}: {
  title: string;
  message: string;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
  error?: string;
}) {
  return (
    <Dialog title={title} onClose={onClose}>
      <p>{message}</p>
      {error && (
        <Feedback error role="alert">
          {error}
        </Feedback>
      )}
      <Actions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : 'Confirm deletion'}
        </Button>
      </Actions>
    </Dialog>
  );
}
