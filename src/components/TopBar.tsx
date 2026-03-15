import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { LogOut, LogIn } from 'lucide-react';
import { ModeToggle } from './mode-toggle';

interface TopBarProps {
  teamName: string;
  userName: string;
  userRole: 'admin' | 'team-leader' | 'dept-head' | 'member' | 'teacher' | 'company' | 'student' | 'guest';
  userAvatar?: string;
  onLogout: () => void;
  onLogin?: () => void;
  isPublic?: boolean;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  'team-leader': 'Team Leader',
  'dept-head': 'Department Head',
  member: 'Member',
  teacher: 'Teacher',
  company: 'Company',
  student: 'Student',
  guest: 'Guest',
};

export function TopBar({ teamName, userName, userRole, userAvatar, onLogout, onLogin, isPublic }: TopBarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <div className="h-20 bg-background border-b border-border px-8 flex items-center justify-between shadow-sm">
      <div className="flex items-center">
        <div>
          <h1 className="text-xl text-foreground font-medium">{teamName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isPublic ? 'Public Platform' : 'Management Dashboard'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <ModeToggle />

        {userRole === 'guest' ? (
          onLogin && (
            <Button
              variant="default"
              size="sm"
              onClick={onLogin}
              className="px-3 py-2 rounded-lg transition-colors"
            >
              <LogIn className="h-4 w-4 mr-2" />
              <span>Log In</span>
            </Button>
          )
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-2 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>Logout</span>
          </Button>
        )}

        <div className="h-8 w-px bg-border"></div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{userName}</p>
            <Badge variant="outline" className={`text-xs mt-1 ${userRole === 'admin' ? 'text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300' :
              userRole === 'team-leader' ? 'text-purple-700 border-purple-300 bg-purple-100 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300' :
                userRole === 'dept-head' ? 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300' :
                  userRole === 'teacher' ? 'text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 dark:text-green-300' :
                    userRole === 'company' ? 'text-red-600 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 dark:text-red-300' :
                      userRole === 'student' ? 'text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300' :
                        userRole === 'guest' ? 'text-gray-600 border-gray-200 bg-gray-50 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-300' :
                          'text-gray-600 border-gray-200 bg-gray-50 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-300'
              }`}>
              {roleLabels[userRole]}
            </Badge>
          </div>
          <Avatar className="h-10 w-10">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="text-sm bg-gradient-to-br from-blue-500 to-blue-600 dark:from-purple-500 dark:to-purple-600 text-white">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}