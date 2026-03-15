import { useEffect } from 'react';
import { PublicStoreProvider, usePublicStore, PublicView } from '../../contexts/PublicStoreContext';
import { Layout } from '../Layout';
import { PublicAuth } from './PublicAuth';
import { PublicDashboard } from './PublicDashboard';
import { PublicEvents } from './PublicEvents';
import { PublicEventDetails } from './PublicEventDetails';
import { PublicCreators } from './PublicCreators';
import { PublicCreatorProfile } from './PublicCreatorProfile';
import { PublicHistory } from './PublicHistory';
import { PublicSettings } from './PublicSettings';

function PublicLayoutContent() {
    const { user, hasGuestAccess, clearGuestAccess, logout, currentView, navigateTo } = usePublicStore();

    useEffect(() => {
        if (user && user.role === 'admin') {
            logout();
            window.location.href = '/manage';
        }
    }, [user, logout]);

    if (!user && !hasGuestAccess) {
        return <PublicAuth />;
    }

    const role = user ? (user.role === 'team-leader' ? 'student' : user.role) : 'guest';
    const userName = user ? user.name : 'Guest User';

    const renderCurrentView = () => {
        switch (currentView) {
            case 'dashboard':
                return <PublicDashboard />;
            case 'events':
                return <PublicEvents />;
            case 'event-details':
                return <PublicEventDetails />;
            case 'creators':
                return <PublicCreators />;
            case 'creator-profile':
                return <PublicCreatorProfile />;
            case 'history':
                return <PublicHistory />;
            case 'settings':
                return <PublicSettings />;
            default:
                return <PublicDashboard />;
        }
    };

    return (
        <Layout
            currentPage={currentView}
            userRole={role}
            teamName="UniConnect"
            userName={userName}
            onNavigate={(id) => navigateTo(id as PublicView)}
            onLogout={logout}
            onLogin={clearGuestAccess}
            isPublic={true}
        >
            {renderCurrentView()}

            <footer className="mt-auto pt-8 pb-4 text-center text-sm text-muted-foreground w-full">
                <p>&copy; {new Date().getFullYear()} UniConnect Public Platform.</p>
            </footer>
        </Layout>
    );
}

export function PublicLayout() {
    return (
        <PublicStoreProvider>
            <PublicLayoutContent />
        </PublicStoreProvider>
    );
}
