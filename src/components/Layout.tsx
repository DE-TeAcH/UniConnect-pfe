import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';
import { ModeToggle } from './mode-toggle';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  userRole?: 'admin' | 'team-leader' | 'teacher' | 'company' | 'student' | 'guest';
  teamName: string;
  userName: string;
  userAvatar?: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onLogin?: () => void;
  isPublic?: boolean;
}

export function Layout({
  children,
  currentPage,
  userRole,
  teamName,
  userName,
  userAvatar,
  onNavigate,
  onLogout,
  onLogin,
  isPublic
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-24 bg-background border-b border-border flex items-center justify-between px-4 z-40">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="mr-2"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <span className="font-semibold text-lg">UniConnect</span>
        </div>

        <div className="flex items-center space-x-8">
          <div className="mr-4">
            <ModeToggle />
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right block">
              <p className="text-xs font-medium text-foreground">{userName}</p>
              <Badge variant="outline" className={`text-[10px] h-5 px-1.5 mt-0.5 ${userRole === 'admin' ? 'text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300' :
                userRole === 'team-leader' ? 'text-purple-700 border-purple-300 bg-purple-100 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300' :
                  userRole === 'teacher' ? 'text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 dark:text-green-300' :
                    userRole === 'company' ? 'text-red-600 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 dark:text-red-300' :
                      userRole === 'student' ? 'text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300' :
                        userRole === 'guest' ? 'text-gray-600 border-gray-200 bg-gray-50 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-300' :
                          'text-gray-600 border-gray-200 bg-gray-50'
                }`}>
                {userRole.replace('-', ' ')}
              </Badge>
            </div>
            <Avatar className="h-9 w-9">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-blue-600 dark:from-purple-500 dark:to-purple-600 text-white">
                {userName ? userName.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2) : '??'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-background shadow-lg transform transition-transform duration-300 ease-in-out md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <Sidebar
          currentPage={currentPage}
          userRole={userRole}
          onNavigate={onNavigate}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={onLogout}
          onLogin={onLogin}
          className="h-full border-none"
          isPublic={isPublic}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar
          currentPage={currentPage}
          userRole={userRole}
          onNavigate={onNavigate}
          isPublic={isPublic}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Desktop TopBar */}
        <div className="hidden md:block">
          <TopBar
            teamName={teamName}
            userName={userName}
            userRole={userRole}
            userAvatar={userAvatar}
            onLogout={onLogout}
            onLogin={onLogin}
            isPublic={isPublic}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 overflow-auto bg-muted/30 dark:bg-background pt-28 md:pt-8 w-full">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}