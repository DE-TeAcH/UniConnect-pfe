import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { api } from '../services/api';
import LightLogo from '../assets/UniConnect_VLight.png';
import DarkLogo from '../assets/UniConnect_Dark.png';

interface LoginPageProps {
  onLogin: (userRole: any, userData: any) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.auth.login(username.trim(), password);

      if (response.success && response.data) {
        const user = response.data;
        onLogin(user.role, {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          teamName: user.team_name || '',
          teamId: user.team_id || null,
          affiliation: user.affiliation || '',
          manage: user.manage,
        });
      } else {
        setError(response.message || 'Invalid username or password.');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-background overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="min-h-full flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center items-center mb-4">
            <img src={LightLogo} alt="UniConnect Logo" className="dark:hidden h-32 w-auto object-contain" />
            <img src={DarkLogo} alt="UniConnect Logo" className="hidden dark:block h-32 w-auto object-contain drop-shadow-sm" />
          </div>

          <Card className="shadow-lg" style={{ padding: '24px' }}>
            <CardHeader className="text-center p-0 mb-6">
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" type="text" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl mb-4" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}