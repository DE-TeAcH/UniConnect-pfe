import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminRequests } from './components/AdminRequests';
import { AdminCreators } from './components/AdminCreators';
import { AdminUsers } from './components/AdminUsers';
import { AdminEvents } from './components/AdminEvents';
import { AdminApplicants } from './components/AdminApplicants';
import { TeamLeaderDashboard } from './components/TeamLeaderDashboard';
import { TeamLeaderEvents } from './components/TeamLeaderEvents';
import { TeamLeaderApplicants } from './components/TeamLeaderApplicants';
import { MemberTeam } from './components/MemberTeam';
import { TeacherDashboard } from './components/TeacherDashboard';
import { TeacherEvents } from './components/TeacherEvents';
import { TeacherApplicants } from './components/TeacherApplicants';
import { CompanyDashboard } from './components/CompanyDashboard';
import { CompanyEvents } from './components/CompanyEvents';
import { CompanyApplicants } from './components/CompanyApplicants';
import { MemberSettings } from './components/MemberSettings';

interface User {
    id: number;
    username: string;
    name: string;
    email: string;
    role: 'admin' | 'team-leader' | 'teacher' | 'company';
    teamName: string;
    teamId: number;
    departmentName?: string;
    departmentId?: number;
    avatar?: string;
    // Teacher-specific
    faculty?: string;
    // Company-specific
    companyName?: string;
    loginTimestamp?: number;
}

const STORAGE_KEY = 'currentUser';
const PAGE_STORAGE_KEY = 'currentPage';

export default function ManagementPortal() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState(() => {
        return localStorage.getItem(PAGE_STORAGE_KEY) || 'dashboard';
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const savedUser = localStorage.getItem(STORAGE_KEY);
            if (savedUser) {
                let userData = JSON.parse(savedUser);
                if (!userData.teamName && userData.team_name) userData.teamName = userData.team_name;
                if (!userData.departmentName && userData.department_name) userData.departmentName = userData.department_name;
                if (!userData.teamId && userData.team_id) userData.teamId = userData.team_id;
                if (!userData.teamId && userData.team_id) userData.teamId = userData.team_id;
                if (!userData.departmentId && userData.department_id) userData.departmentId = userData.department_id;

                // Session timeout check
                const loginTimestamp = userData.loginTimestamp;
                if (loginTimestamp) {
                    const SESSION_TIMEOUT = 30 * 60 * 1000;
                    if (Date.now() - loginTimestamp > SESSION_TIMEOUT) {
                        localStorage.removeItem(STORAGE_KEY);
                        localStorage.removeItem(PAGE_STORAGE_KEY);
                        setCurrentUser(null);
                        alert('Session expired. Please log in again.');
                    } else {
                        setCurrentUser(userData);
                    }
                } else {
                    setCurrentUser(userData);
                }
            }
        } catch (error) {
            console.error('Failed to restore user session:', error);
            localStorage.removeItem(STORAGE_KEY);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Periodic session timeout check
    useEffect(() => {
        const SESSION_TIMEOUT = 30 * 60 * 1000;
        const checkSession = () => {
            if (currentUser && currentUser.loginTimestamp) {
                const now = Date.now();
                if (now - currentUser.loginTimestamp > SESSION_TIMEOUT) {
                    handleLogout();
                    alert('Session expired. Please log in again.');
                }
            }
        };

        const interval = setInterval(checkSession, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [currentUser]);

    const handleLogin = (userRole: User['role'], userData: User) => {
        const userWithTimestamp = { ...userData, loginTimestamp: Date.now() };
        setCurrentUser(userWithTimestamp);
        setCurrentPage('dashboard');
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithTimestamp));
            localStorage.setItem(PAGE_STORAGE_KEY, 'dashboard');
        } catch (error) {
            console.error('Failed to save user session:', error);
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentPage('dashboard');
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(PAGE_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear user session:', error);
        }
    };

    // Initial history setup
    useEffect(() => {
        window.history.replaceState({ page: currentPage }, '', window.location.href);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle back button (popstate)
    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            if (e.state && e.state.page) {
                setCurrentPage(e.state.page);
                localStorage.setItem(PAGE_STORAGE_KEY, e.state.page);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const handleNavigate = (page: string) => {
        if (page !== currentPage) {
            window.history.pushState({ page }, '', window.location.href);
            setCurrentPage(page);
            localStorage.setItem(PAGE_STORAGE_KEY, page);
        }
    };

    const handleProfileUpdate = (updatedUser: Partial<User>) => {
        if (currentUser) {
            const newUser = { ...currentUser, ...updatedUser };
            setCurrentUser(newUser);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
            } catch (error) {
                console.error('Failed to update user session:', error);
            }
        }
    };

    const renderPage = () => {
        if (!currentUser) return null;

        switch (currentUser.role) {
            case 'admin':
                switch (currentPage) {
                    case 'dashboard': return <AdminDashboard />;
                    case 'requests': return <AdminRequests />;
                    case 'teams': return <AdminCreators />;
                    case 'users': return <AdminUsers />;
                    case 'events': return <AdminEvents />;
                    case 'applicants': return <AdminApplicants />;
                    case 'settings': return <MemberSettings currentUser={currentUser} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />;
                    default: return <AdminDashboard />;
                }

            case 'team-leader':
                switch (currentPage) {
                    case 'dashboard': return <TeamLeaderDashboard currentUser={currentUser} />;
                    case 'events': return <TeamLeaderEvents currentUser={currentUser} />;
                    case 'applicants': return <TeamLeaderApplicants currentUser={currentUser} />;
                    case 'settings': return <MemberSettings currentUser={currentUser} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />;
                    default: return <TeamLeaderDashboard currentUser={currentUser} />;
                }

            case 'teacher':
                switch (currentPage) {
                    case 'dashboard': return <TeacherDashboard currentUser={currentUser} />;
                    case 'events': return <TeacherEvents currentUser={currentUser} />;
                    case 'applicants': return <TeacherApplicants currentUser={currentUser} />;
                    case 'settings': return <MemberSettings currentUser={currentUser} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />;
                    default: return <TeacherDashboard currentUser={currentUser} />;
                }

            case 'company':
                switch (currentPage) {
                    case 'dashboard': return <CompanyDashboard currentUser={currentUser} />;
                    case 'events': return <CompanyEvents currentUser={currentUser} />;
                    case 'applicants': return <CompanyApplicants currentUser={currentUser} />;
                    case 'settings': return <MemberSettings currentUser={currentUser} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />;
                    default: return <CompanyDashboard currentUser={currentUser} />;
                }

            default:
                return <AdminDashboard />;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <Layout
            currentPage={currentPage}
            userRole={currentUser.role}
            teamName={currentUser.teamName}
            userName={currentUser.name}
            userAvatar={currentUser.avatar}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
        >
            {renderPage()}
        </Layout>
    );
}
