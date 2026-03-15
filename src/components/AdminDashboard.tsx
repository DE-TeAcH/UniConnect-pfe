import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Users, Calendar, TrendingUp, Trophy, Building, RefreshCw, Mic, MapPin, Award } from 'lucide-react';
import { api } from '../services/api';

export function AdminDashboard() {
  const [stats, setStats] = useState({ totalTeams: 0, totalUsers: 0, totalEvents: 0, activeEvents: 0 });
  const [topTeams, setTopTeams] = useState<any[]>([]);
  const [topEvents, setTopEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, teamsRes, eventsRes] = await Promise.all([
        api.users.get(),
        api.teams.get(),
        api.events.get(),
      ]) as any[];

      let totalUsers = 0, totalTeams = 0, totalEvents = 0, activeEvents = 0;

      if (usersRes.success && Array.isArray(usersRes.data)) totalUsers = usersRes.data.length;
      if (teamsRes.success && Array.isArray(teamsRes.data)) {
        totalTeams = teamsRes.data.length;
        setTopTeams(teamsRes.data.slice(0, 3).map((t: any) => ({
          id: t.id, name: t.name, representative: t.representative_name || '—', location: t.location || '—'
        })));
      }
      if (eventsRes.success && Array.isArray(eventsRes.data)) {
        totalEvents = eventsRes.data.length;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        activeEvents = eventsRes.data.filter((e: any) => {
          const ed = e.end_date && e.end_date.length > 10 ? e.end_date.substring(0, 10) : e.end_date;
          return new Date(ed + 'T23:59:59') >= today;
        }).length;
        setTopEvents(
          [...eventsRes.data]
            .sort((a: any, b: any) => (b.registration_count || 0) - (a.registration_count || 0))
            .slice(0, 3)
        );
      }

      setStats({ totalTeams, totalUsers, totalEvents, activeEvents });
    } catch (e) {
      console.error('Failed to fetch dashboard data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]?.toUpperCase() || '').join('').slice(0, 2);
  };

  const statsDisplay = [
    { title: 'Total Teams', value: stats.totalTeams.toString(), sub: 'Active teams', icon: Building, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Total Users', value: stats.totalUsers.toString(), sub: 'Registered users', icon: Users, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { title: 'Total Events', value: stats.totalEvents.toString(), sub: 'All platform events', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { title: 'Active Events', value: stats.activeEvents.toString(), sub: 'Currently scheduled', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2">Monitor all teams, users, and platform activity</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={isLoading} className="w-full md:w-auto">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsDisplay.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-1.5 rounded-lg ${stat.bg}`}><Icon className={`h-4 w-4 ${stat.color}`} /></div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg"><Trophy className="h-5 w-5 text-yellow-500" />Teams</CardTitle>
            <CardDescription>Registered teams on the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topTeams.length > 0 ? topTeams.map((team, i) => (
              <div key={team.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-6 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : 'text-amber-600'}`}>#{i + 1}</span>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">{getInitials(team.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground text-sm">{team.name}</p>
                    <p className="text-xs text-muted-foreground">{team.representative} · {team.location}</p>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-8">No team data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg"><Award className="h-5 w-5 text-orange-500" />Top Attended Events</CardTitle>
            <CardDescription>Events with the highest registration count</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topEvents.length > 0 ? topEvents.map((event: any, i: number) => (
              <div key={event.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-6 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : 'text-amber-600'}`}>#{i + 1}</span>
                  <div>
                    <p className="font-medium text-foreground text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mic className="h-3 w-3" />{event.creator_name || '—'} · <MapPin className="h-3 w-3 ml-1" />{event.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{event.registration_count || 0}</p>
                  <p className="text-xs text-muted-foreground">registrations</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-8">No events yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}