import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import DocumentListPage from '@/pages/DocumentListPage';
import DocumentDetailPage from '@/pages/DocumentDetailPage';
import ComparePage from '@/pages/ComparePage';
import CreateDocumentPage from '@/pages/CreateDocumentPage';

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
      // New: project-level document detail (category-agnostic)
      {
        path: 'projects/:pid/docs/:filename',
        element: <DocumentDetailPage />
      },
      // Backward compatibility: category-level document detail (still works)
      {
        path: 'projects/:pid/categories/:cid/docs/:filename',
        element: <DocumentDetailPage />
      },
      // New: project-level compare route
      {
        path: 'projects/:pid/docs/:filename/compare',
        element: <ComparePage />
      },
      // Backward compatibility: category-level compare route
      {
        path: 'projects/:pid/categories/:cid/docs/:filename/compare',
        element: <ComparePage />
      },
      // New: create document routes
      {
        path: 'projects/:pid/create',
        element: <CreateDocumentPage />
      },
      {
        path: 'projects/:pid/categories/:cid/create',
        element: <CreateDocumentPage />
      }
    ]
  }
]);