import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router';
import { Shell } from './components/Shell';
import { Missing } from './components/UI';
import { createHybridDataSource } from './data/hybrid-source';
// import { hasSession } from './data/session';
import type { FrontendDataSource } from './data/types';
import { WorkspaceProvider } from './features/WorkspaceProvider';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { Projects } from './pages/Projects';
import { SubtaskForm } from './pages/SubtaskForm';
import { TaskForm } from './pages/TaskForm';
import { TaskDetail, Tasks } from './pages/Tasks';
import { Today } from './pages/Today';
import './styles/app.css';
import { ApiConnectionTest } from './components/ApiConnectionTest';
import { ApiProjects } from './pages/ApiProjects';
import { ApiUsers } from './pages/ApiUsers';
import { createLocalDataSource } from './data/local-source';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';

export const source =
  import.meta.env.VITE_DATA_MODE === 'demo'
    ? createLocalDataSource(window.localStorage)
    : createHybridDataSource();

// function Protected({ source }: { source: FrontendDataSource }) {
//   const location = useLocation();
//   return hasSession() ? (
//     <WorkspaceProvider source={source}>
//       <Outlet />
//     </WorkspaceProvider>
//   ) : (
//     <Navigate
//       to="/login"
//       replace
//       state={{ from: location.pathname + location.search }}
//     />
//   );
// }

function Protected({ source }: { source: FrontendDataSource }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({
        appState: {
          returnTo: window.location.pathname,
        },
      });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <WorkspaceProvider source={source}>
      <Outlet />
    </WorkspaceProvider>
  );
}

function TaskEditor() {
  const { id } = useParams();
  return <TaskForm key={id ?? 'new'} />;
}

function SubtaskEditor() {
  const { id, subtaskId } = useParams();
  return <SubtaskForm key={`${id}:${subtaskId ?? 'new'}`} />;
}

export function AppRoutes({ source }: { source: FrontendDataSource }) {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/api-test" element={<ApiConnectionTest />} />
      <Route path="/api-projects" element={<ApiProjects />} />
      <Route element={<Protected source={source} />}>
        <Route element={<Shell />}>
          <Route path="api-users" element={<ApiUsers />} />
          <Route index element={<Today />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<Projects />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/new" element={<TaskEditor />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="tasks/:id/edit" element={<TaskEditor />} />
          <Route path="tasks/:id/subtasks/new" element={<SubtaskEditor />} />
          <Route
            path="tasks/:id/subtasks/:subtaskId/edit"
            element={<SubtaskEditor />}
          />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Missing />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default function App() {
  return <AppRoutes source={source} />;
}
