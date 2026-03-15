import React from 'react';
import { Button } from './ui/button';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  MessageSquare,
  Building,
  LogOut,
  UserCheck,
  Globe2,
  LogIn,
  History
} from 'lucide-react';
import LightLogo from '../assets/UniConnect_VLight.png';
import DarkLogo from '../assets/UniConnect_Dark.png';

interface SidebarProps {
  currentPage: string;
  userRole: 'admin' | 'team-leader' | 'teacher' | 'company' | 'student' | 'guest';
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  onLogin?: () => void;
  onClose?: () => void;
  className?: string;
  isPublic?: boolean;
}

const navigationItems = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'applicants', label: 'Applicants', icon: UserCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  'team-leader': [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'applicants', label: 'Applicants', icon: UserCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  teacher: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'applicants', label: 'Applicants', icon: UserCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  company: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'applicants', label: 'Applicants', icon: UserCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  student: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'creators', label: 'Creators', icon: Users },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  guest: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'creators', label: 'Creators', icon: Users },
  ],
};

const roleDisplayConfig: Record<string, { label: string }> = {
  admin: { label: 'Administrator' },
  'team-leader': { label: 'Team Leader' },
  teacher: { label: 'Teacher' },
  company: { label: 'Company' },
  student: { label: 'Student' },
  guest: { label: 'Guest' },
};

export function Sidebar({ currentPage, userRole, onNavigate, onClose, onLogout, onLogin, className = '', isPublic }: SidebarProps) {
  // If in public mode, teachers and team leaders should see the student sidebar
  const effectiveRole = isPublic && (userRole === 'teacher' || userRole === 'team-leader') ? 'student' : userRole;

  const items = navigationItems[effectiveRole] || navigationItems.admin;
  const config = roleDisplayConfig[userRole] || roleDisplayConfig.admin;

  const handleNavigate = (id: string) => {
    onNavigate(id);
    if (onClose) onClose();
  };

  return (
    <div className={`w-72 bg-background border-r border-border flex flex-col shadow-sm ${className}`}>
      <div className="p-2 border-b border-border flex justify-center items-center">
        <img src={LightLogo} alt="UniConnect Logo" className="dark:hidden h-23 w-auto object-contain" />
        <img src={DarkLogo} alt="UniConnect Logo" className="hidden dark:block h-23 w-auto object-contain" />
      </div>

      <nav className="flex-1 p-6 overflow-y-auto">
        <ul className="space-y-2">
          {items.map((item) => {
            const ItemIcon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start px-4 py-3 h-auto transition-all duration-200 ${isActive
                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-r-4 border-blue-600 rounded-r-none dark:!bg-purple-700/20 dark:!text-purple-200 dark:!border-purple-500 dark:hover:!bg-purple-700/30'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  onClick={() => handleNavigate(item.id)}
                >
                  <ItemIcon className={`mr-3 h-5 w-5 ${isActive ? 'text-brand-400' : 'text-muted-foreground'}`} />
                  <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-6 pb-4">
        {userRole === 'guest' ? (
          onLogin && (
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10"
              onClick={onLogin}
            >
              <LogIn className="mr-3 h-5 w-5" />
              <span className="font-medium">Log In</span>
            </Button>
          )
        ) : (
          onLogout && (
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
              onClick={onLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span className="font-medium">Logout</span>
            </Button>
          )
        )}
      </div>

      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          UniConnect v2.0
        </div>
      </div>
    </div>
  );
}