import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import DocumentListPage from '@/pages/DocumentListPage';
import DocumentDetailPage from '@/pages/DocumentDetailPage';
import ComparePage from '@/pages/ComparePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app/projects" replace />
  },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      {
        path: 'projects',
        element: <DocumentListPage />
      },
      {
        path: 'projects/:pid',
        element: <DocumentListPage />
      },
      {
        path: 'projects/:pid/categories/:cid',
        element: <DocumentListPage />
      },
      {
        path: 'projects/:pid/categories/:cid/docs/:filename',
        element: <DocumentDetailPage />
      },
      {
        path: 'projects/:pid/categories/:cid/docs/:filename/compare',
        element: <ComparePage />
      }
    ]
  }
]);