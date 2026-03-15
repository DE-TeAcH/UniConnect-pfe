import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Calendar, MapPin, CheckCircle2, Clock, Search } from 'lucide-react';
import { usePublicStore } from '../../contexts/PublicStoreContext';
import { api } from '../../services/api';

export function PublicHistory() {
    const { user, appliedEventIds, savedEventIds, navigateTo } = usePublicStore();

    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'all' | 'favorites' | 'applied' | 'visited'>('all');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<string>('All');
    const [creatorType, setCreatorType] = useState<string>('All');
    const [paymentType, setPaymentType] = useState<string>('All');
    const [eventStatus, setEventStatus] = useState<string>('All');
    const [sortBy, setSortBy] = useState<string>('Most Attended');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.events.get();
                if (res.success && Array.isArray(res.data)) setAllEvents(res.data);
            } catch (e) { console.error('Failed to fetch events', e); }
        };
        fetchEvents();
    }, []);

    // If not logged in, shouldn't really reach here because of router/nav logic,
    // but just in case, show a fallback message.
    if (!user) {
        return (
            <div className="text-center py-20">
                <h1 className="text-3xl font-bold mb-4">You must be logged in to view history.</h1>
                <Button onClick={() => navigateTo('dashboard')}>Go Home</Button>
            </div>
        );
    }

    // MySQL returns dates as ISO strings like '2026-03-10T00:00:00.000Z'
    // We need to extract just 'YYYY-MM-DD' before combining with time
    const toDateOnly = (d: string) => {
        if (!d) return '';
        if (d.length === 10) return d;
        return d.substring(0, 10);
    };

    const getEventStatus = (event: any) => {
        const now = new Date();
        const sd = toDateOnly(event.start_date);
        const ed = toDateOnly(event.end_date);
        const startDate = new Date(`${sd}T${event.start_time || '00:00:00'}`);
        const endDate = new Date(`${ed}T${event.end_time || '23:59:59'}`);
        if (now > endDate) return 'completed';
        if (now >= startDate && now <= endDate) return 'active';
        return 'upcoming';
    };

    const historyEvents = useMemo(() => {
        const relevantEvents = allEvents.filter(e => appliedEventIds.includes(e.id) || savedEventIds.includes(e.id));

        return relevantEvents.filter(e => {
            const isApplied = appliedEventIds.includes(e.id);
            const isSaved = savedEventIds.includes(e.id);
            const isPast = new Date(e.end_date) < new Date();

            if (viewMode === 'favorites' && !isSaved) return false;
            if (viewMode === 'applied' && !isApplied) return false;
            if (viewMode === 'visited' && !(isApplied && isPast)) return false;

            if (search) {
                const query = search.toLowerCase();
                const matchesSearch =
                    e.title.toLowerCase().includes(query) ||
                    (e.creator_name || '').toLowerCase().includes(query) ||
                    e.location.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            if (category !== 'All' && e.category_name !== category) return false;

            if (creatorType !== 'All') {
                const ct = creatorType === 'Club' ? 'team_leader' : creatorType.toLowerCase();
                if (e.creator_role !== ct) return false;
            }

            if (paymentType !== 'All') {
                if (paymentType === 'Free' && e.is_paid) return false;
                if (paymentType === 'Paid' && !e.is_paid) return false;
            }

            // Event status filter
            if (eventStatus !== 'All') {
                const status = getEventStatus(e);
                if (eventStatus === 'Completed' && status !== 'completed') return false;
                if (eventStatus === 'Active' && status !== 'active') return false;
                if (eventStatus === 'Upcoming' && status !== 'upcoming') return false;
            }

            return true;
        }).sort((a, b) => {
            // When a specific status is selected, use status-specific sorting
            if (eventStatus === 'Completed') {
                return new Date(toDateOnly(b.end_date)).getTime() - new Date(toDateOnly(a.end_date)).getTime();
            }
            if (eventStatus === 'Active') {
                return new Date(`${toDateOnly(a.end_date)}T${a.end_time || '23:59:59'}`).getTime() - new Date(`${toDateOnly(b.end_date)}T${b.end_time || '23:59:59'}`).getTime();
            }
            if (eventStatus === 'Upcoming') {
                return new Date(`${toDateOnly(a.start_date)}T${a.start_time || '00:00:00'}`).getTime() - new Date(`${toDateOnly(b.start_date)}T${b.start_time || '00:00:00'}`).getTime();
            }

            switch (sortBy) {
                case 'Most Attended': return (b.registration_count || 0) - (a.registration_count || 0);
                case 'Newest': return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
                case 'Upcoming Soon': return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
                case 'Oldest': return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
                case 'Price Low to High': return (a.price || 0) - (b.price || 0);
                case 'Price High to Low': return (b.price || 0) - (a.price || 0);
                default: return 0;
            }
        });
    }, [allEvents, appliedEventIds, savedEventIds, search, category, creatorType, paymentType, eventStatus, sortBy, viewMode]);

    const renderEventCard = (event: any) => {
        const isPast = new Date(event.end_date) < new Date();
        const isApplied = appliedEventIds.includes(event.id);
        const isSaved = savedEventIds.includes(event.id);

        return (
            <Card key={event.id} className={`group ${isPast ? 'opacity-80 hover:opacity-100 transition-opacity' : ''}`}>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-3 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">{event.category_name}</Badge>
                                {isPast ? (
                                    <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>
                                ) : (
                                    <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Upcoming</Badge>
                                )}
                                {isSaved && (
                                    <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Favorite</Badge>
                                )}
                            </div>

                            <h3 className="font-bold text-xl">{event.title}</h3>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {event.start_date} • {event.start_time}</span>
                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.location}</span>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center gap-3 border-l pl-0 md:pl-6 min-w-[140px]">
                            <Button variant="outline" className="w-full" onClick={() => navigateTo('event-details', event.id)}>
                                View Details
                            </Button>
                            {isApplied ? (
                                <p className="text-xs text-center text-muted-foreground">Status: <span className="font-semibold text-foreground">Approved</span></p>
                            ) : null}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center mb-8 space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight">My History</h1>
                <p className="text-muted-foreground text-lg">Manage your event applications, visits, and favorites.</p>
            </div>

            {/* Toggle & Filters */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex justify-center">
                    <div className="bg-muted p-1 rounded-lg inline-flex flex-wrap justify-center gap-1">
                        <Button variant={viewMode === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => { setViewMode('all'); setPaymentType('All'); }} className="rounded-md">All History</Button>
                        <Button variant={viewMode === 'favorites' ? 'default' : 'ghost'} size="sm" onClick={() => { setViewMode('favorites'); setPaymentType('All'); }} className="rounded-md">Favorites</Button>
                        <Button variant={viewMode === 'applied' ? 'default' : 'ghost'} size="sm" onClick={() => { setViewMode('applied'); setPaymentType('Free'); }} className="rounded-md">Applied</Button>
                        <Button variant={viewMode === 'visited' ? 'default' : 'ghost'} size="sm" onClick={() => { setViewMode('visited'); setPaymentType('Paid'); }} className="rounded-md">Visited</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background h-9 border-muted-foreground/20" />
                    </div>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="flex h-9 w-full items-center justify-between rounded-md border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        {['All', 'Conference', 'Workshop', 'Seminar', 'Competition', 'Networking', 'Training', 'Open Day', 'Special'].map(c => <option key={c} value={c}>{c === 'All' ? 'Category' : c}</option>)}
                    </select>
                    <select value={creatorType} onChange={e => setCreatorType(e.target.value)} className="flex h-9 w-full items-center justify-between rounded-md border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        {['All', 'Teacher', 'Company', 'Club'].map(c => <option key={c} value={c}>{c === 'All' ? 'Creator Type' : c}</option>)}
                    </select>
                    <select value={paymentType} onChange={e => setPaymentType(e.target.value)} disabled={viewMode === 'applied' || viewMode === 'visited'} className="flex h-9 w-full items-center justify-between rounded-md border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        {['All', 'Free', 'Paid'].map(c => <option key={c} value={c}>{c === 'All' ? 'Free / Paid' : c}</option>)}
                    </select>
                    <select value={eventStatus} onChange={e => setEventStatus(e.target.value)} className="flex h-9 w-full items-center justify-between rounded-md border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        {['All', 'Completed', 'Active', 'Upcoming'].map(c => <option key={c} value={c}>{c === 'All' ? 'Status' : c}</option>)}
                    </select>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} disabled={eventStatus !== 'All'} className="flex h-9 w-full items-center justify-between rounded-md border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        {['Most Attended', 'Newest', 'Upcoming Soon', 'Oldest', 'Price Low to High', 'Price High to Low'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-2">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        {viewMode === 'all' && 'All Interactions'}
                        {viewMode === 'favorites' && 'Favorite Events'}
                        {viewMode === 'applied' && 'Applied Events'}
                        {viewMode === 'visited' && 'Visited Events'}
                    </h2>
                    <span className="text-sm text-muted-foreground">{historyEvents.length} result{historyEvents.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="space-y-4">
                    {historyEvents.length > 0 ? (
                        historyEvents.map(e => renderEventCard(e))
                    ) : (
                        <Card className="border-dashed bg-muted/20">
                            <CardContent className="p-12 text-center flex flex-col items-center justify-center">
                                <Search className="w-10 h-10 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground text-lg">No events found matching your criteria.</p>
                                <Button variant="link" className="mt-2 text-primary text-base" onClick={() => {
                                    setSearch(''); setCategory('All'); setCreatorType('All'); setPaymentType('All'); setEventStatus('All'); setSortBy('Most Attended');
                                }}>
                                    Clear Filters
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
