import { Route, Routes } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { ToastProvider } from './components/ui/ToastProvider';
import { CreateTaskPage } from './pages/CreateTaskPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditTaskPage } from './pages/EditTaskPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TaskDetailsPage } from './pages/TaskDetailsPage';
import { TasksPage } from './pages/TasksPage';

/** The app's routes. The router itself is supplied by main.tsx (or by tests). */
export function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/new" element={<CreateTaskPage />} />
          <Route path="tasks/:id" element={<TaskDetailsPage />} />
          <Route path="tasks/:id/edit" element={<EditTaskPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
