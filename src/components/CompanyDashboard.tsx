import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Briefcase, Calendar, Users, Trophy, MapPin, TrendingUp } from 'lucide-react';
import { api } from '../services/api';

interface CompanyDashboardProps {
    currentUser: any;
}

export function CompanyDashboard({ currentUser }: CompanyDashboardProps) {
    const [myEvents, setMyEvents] = useState<any[]>([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.events.get({ creator_id: currentUser?.id });
                if (res.success && Array.isArray(res.data)) setMyEvents(res.data);
            } catch (e) {
                console.error('Failed to fetch events', e);
            }
        };
        fetchEvents();
    }, [currentUser]);

    const top3 = [...myEvents].sort((a, b) => (b.registration_count || 0) - (a.registration_count || 0)).slice(0, 3);
    const totalRegistrations = myEvents.reduce((acc, e) => acc + (e.registration_count || 0), 0);

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const stats = [
        {
            title: 'Company',
            value: currentUser?.teamName || currentUser?.name || 'N/A',
            icon: Briefcase,
            color: 'text-orange-600',
            description: 'Your organization name',
        },
        {
            title: 'Events Created',
            value: myEvents.length.toString(),
            icon: Calendar,
            color: 'text-blue-600',
            description: 'Total events organized',
        },
        {
            title: 'Total Registrations',
            value: totalRegistrations.toString(),
            icon: Users,
            color: 'text-purple-600',
            description: 'Across all your events',
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Company Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Welcome, <strong>{currentUser?.teamName || currentUser?.name}</strong> — Manage your events and track registrations
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title} className={`border-0 shadow-sm hover:shadow-md transition-shadow${index === 0 ? ' col-span-2 md:col-span-1' : ''}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                                <div className="p-2 rounded-lg bg-muted/50">
                                    <Icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-xl font-semibold text-foreground mb-1 truncate">{stat.value}</div>
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>{stat.description}</span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <span>Top 3 Most Attended Events</span>
                    </CardTitle>
                    <CardDescription>Your events ranked by total registrations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {top3.length > 0 ? top3.map((event: any, index: number) => (
                        <div key={event.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                            <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold flex-shrink-0 ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                index === 1 ? 'bg-gray-100 text-gray-600' :
                                    'bg-amber-50 text-amber-700'
                                }`}>
                                #{index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">{event.title}</p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(event.start_date)}</span>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-xl font-bold text-foreground">{event.registration_count || 0}</p>
                                <p className="text-xs text-muted-foreground">registrations</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-muted-foreground py-8">No events created yet</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
