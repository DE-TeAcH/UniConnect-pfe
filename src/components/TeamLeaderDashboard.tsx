import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Users, Calendar, Building, RefreshCw, MapPin } from 'lucide-react';
import { api } from '../services/api';

interface TeamLeaderDashboardProps {
  currentUser: any;
}

export function TeamLeaderDashboard({ currentUser }: TeamLeaderDashboardProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcomingEvents = events.filter(e => {
    const ed = e.end_date && e.end_date.length > 10 ? e.end_date.substring(0, 10) : e.end_date;
    return new Date(ed + 'T23:59:59') >= today;
  }).slice(0, 3);
  const totalEvents = events.length;
  const eventsThisMonth = events.filter(e => {
    const sd = e.start_date && e.start_date.length > 10 ? e.start_date.substring(0, 10) : e.start_date;
    const d = new Date(sd + 'T00:00:00');
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).length;

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [eventsRes, followsRes] = await Promise.all([
        api.events.get({ creator_id: currentUser?.id }),
        api.follows.get({ creator_id: currentUser?.id }),
      ]) as any[];

      if (eventsRes.success && Array.isArray(eventsRes.data)) setEvents(eventsRes.data);
      if (followsRes.success && Array.isArray(followsRes.data)) setFollowerCount(followsRes.data.length);
    } catch (e) {
      console.error('Failed to fetch dashboard data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, [currentUser]);

  const formatDate = (d: string) => {
    const dateOnly = d && d.length > 10 ? d.substring(0, 10) : d;
    return new Date(dateOnly + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statsDisplay = [
    { title: 'Total Followers', value: followerCount.toString(), sub: 'People following you', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Total Events', value: totalEvents.toString(), sub: 'All events', icon: Calendar, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { title: 'Events This Month', value: eventsThisMonth.toString(), sub: 'Current month', icon: Building, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Team Dashboard</h1>
          <p className="text-muted-foreground mt-2">Overview of your team's performance and recent activities</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={isLoading} className="w-full md:w-auto">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg"><Calendar className="h-5 w-5 text-purple-500" />Upcoming Events</CardTitle>
            <CardDescription>Events scheduled for your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length > 0 ? upcomingEvents.map((event: any) => (
              <div key={event.id} className="p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-foreground text-sm">{event.title}</h4>
                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 text-xs">
                    {(() => {
                      const ed = event.end_date && event.end_date.length > 10 ? event.end_date.substring(0, 10) : event.end_date;
                      return new Date(ed + 'T23:59:59') >= today ? 'upcoming' : 'completed';
                    })()}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(event.start_date)}</span>
                </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-8">No upcoming events</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}