import { createBrowserRouter } from 'react-router-dom';
import ManagementPortal from './ManagementPortal';
import { PublicLayout } from './components/public/PublicLayout';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <PublicLayout />
    },
    {
        path: '/manage/*',
        element: <ManagementPortal />
    }
]);
