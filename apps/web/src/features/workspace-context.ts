import { createContext, useContext } from 'react';
import type { FrontendDataSource, Workspace } from '../data/types';

export interface WorkspaceContextValue {
  workspace: Workspace;
  source: FrontendDataSource;
  now: Date;
  busy: boolean;
  notice: string;
  error: string;
  run: (
    operation: () => Promise<Workspace>,
    message: string,
  ) => Promise<boolean>;
}
export const WorkspaceContext = createContext<WorkspaceContextValue | null>(
  null,
);
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('Workspace provider is missing.');
  return context;
}
