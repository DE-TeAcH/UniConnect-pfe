import { createBrowserRouter, Navigate } from 'react-router-dom';
import ManagementPortal from './ManagementPortal';
import { PublicLayout } from './components/public/PublicLayout';
import { PublicDashboard } from './components/public/PublicDashboard';
import { PublicEvents } from './components/public/PublicEvents';
import { PublicEventDetails } from './components/public/PublicEventDetails';
import { PublicCreators } from './components/public/PublicCreators';
import { PublicCreatorProfile } from './components/public/PublicCreatorProfile';
import { PublicHistory } from './components/public/PublicHistory';
import { PublicSettings } from './components/public/PublicSettings';
import { PublicAuth } from './components/public/PublicAuth';

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
