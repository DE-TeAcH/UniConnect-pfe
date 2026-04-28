import { useState, useMemo, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Search, Calendar, MapPin, User, Users, Heart, ArrowUpRight, CheckCircle2, Building, Loader2, ChevronDown } from 'lucide-react';
import { api } from '../../services/api';
import { usePublicStore } from '../../contexts/PublicStoreContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

export function PublicEvents() {
    const { user, requireLogin, applyToEvent, appliedEventIds, savedEventIds, saveEvent, unsaveEvent, followedCreatorIds } = usePublicStore();

    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'all' | 'favorites' | 'following'>('all');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<string>('All');
    const [creatorType, setCreatorType] = useState<string>('All');
    const [paymentType, setPaymentType] = useState<string>('All');
    const [eventStatus, setEventStatus] = useState<string>('All');
    const [sortBy, setSortBy] = useState<string>('Most Attended');

    const [categories, setCategories] = useState<any[]>([]);

    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.events.get();
                if (res.success && Array.isArray(res.data)) setAllEvents(res.data);
            } catch (e) { console.error('Failed to fetch events', e); }
        };
        const fetchCategories = async () => {
            try {
                const res = await api.eventCategories.get();
                if (res.success && Array.isArray(res.data)) setCategories(res.data);
            } catch (e) { console.error('Failed to fetch categories', e); }
        };
        fetchEvents();
        fetchCategories();
    }, []);

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

    const filteredEvents = useMemo(() => {
        return allEvents.filter(e => {
            if (viewMode === 'favorites' && !savedEventIds.includes(e.id)) return false;

            if (viewMode === 'following' && (!e.creator_id || !followedCreatorIds.includes(e.creator_id))) return false;


            if (search) {
                const query = search.toLowerCase();
                const matchesSearch =
                    e.title.toLowerCase().includes(query) ||
                    (e.description || '').toLowerCase().includes(query) ||
                    (e.category_name || '').toLowerCase().includes(query) ||
                    (e.creator_name || '').toLowerCase().includes(query) ||
                    e.location.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            if (category !== 'All' && e.category_id !== category) return false;

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
                // Most recently completed first
                return new Date(toDateOnly(b.end_date)).getTime() - new Date(toDateOnly(a.end_date)).getTime();
            }
            if (eventStatus === 'Active') {
                // Shortest time remaining (ending soonest) first
                return new Date(`${toDateOnly(a.end_date)}T${a.end_time || '23:59:59'}`).getTime() - new Date(`${toDateOnly(b.end_date)}T${b.end_time || '23:59:59'}`).getTime();
            }
            if (eventStatus === 'Upcoming') {
                // Closest start date first
                return new Date(`${toDateOnly(a.start_date)}T${a.start_time || '00:00:00'}`).getTime() - new Date(`${toDateOnly(b.start_date)}T${b.start_time || '00:00:00'}`).getTime();
            }

            // Default sorting when status is 'All'
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
    }, [allEvents, search, category, creatorType, paymentType, eventStatus, sortBy, viewMode, savedEventIds, followedCreatorIds]);

    const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

    const handleApply = (eventId: string) => {
        requireLogin(async () => {
            setLoadingActions(prev => ({...prev, [eventId]: true}));
            try {
                await applyToEvent(eventId);
                toast.success('Successfully applied to event!');
            } catch (err) {
                // error handled in context
            } finally {
                setLoadingActions(prev => ({...prev, [eventId]: false}));
            }
        });
    };

    const handleVisitWebsite = async (eventId: string, url?: string) => {
        if (url) {
            setLoadingActions(prev => ({...prev, [eventId]: true}));
            try {
                await api.eventRedirects.create({ event_id: String(eventId), user_id: user ? String(user.id) : undefined });
                window.open(url, '_blank');
            } catch (err) {
                console.error('Failed to log redirect', err);
            } finally {
                setLoadingActions(prev => ({...prev, [eventId]: false}));
            }
        } else {
            toast.info('No website link available.');
        }
    };

    const toggleSave = (eventId: string) => {
        requireLogin(async () => {
            setLoadingActions(prev => ({...prev, [eventId]: true}));
            try {
                if (savedEventIds.includes(eventId)) {
                    await unsaveEvent(eventId);
                    toast.success('Removed from favorites.');
                } else {
                    await saveEvent(eventId);
                    toast.success('Added to favorites.');
                }
            } catch (err) {
            } finally {
                setLoadingActions(prev => ({...prev, [eventId]: false}));
            }
        });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isEventActive = (event: any) => {
        const ed = toDateOnly(event.end_date);
        const eventEndDateTime = new Date(`${ed}T${event.end_time || '23:59:59'}`);
        return eventEndDateTime >= new Date();
    };

    const statusBadge = (event: any) => {
        const status = getEventStatus(event);
        const styles: Record<string, string> = {
            upcoming: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
            active: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
            completed: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
        };
        return <Badge variant="outline" className={styles[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 text-center space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight">Explore Events</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Browse public events, workshops, and conferences curated by our creators.</p>
            </div>

            {/* Toggle & Filters */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex justify-center">
                    <div className="bg-muted p-1 rounded-lg inline-flex overflow-x-auto max-w-full">
                        <Button variant={viewMode === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('all')} className="rounded-md whitespace-nowrap">All Events</Button>
                        <Button variant={viewMode === 'favorites' ? 'default' : 'ghost'} size="sm" onClick={() => requireLogin(() => setViewMode('favorites'))} className="rounded-md whitespace-nowrap">Favorites</Button>
                        <Button variant={viewMode === 'following' ? 'default' : 'ghost'} size="sm" onClick={() => requireLogin(() => setViewMode('following'))} className="rounded-md whitespace-nowrap">Following</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background h-9 border-muted-foreground/20" />
                    </div>
                    <div className="relative">
                        <select value={category} onChange={e => setCategory(e.target.value)} className="h-9 w-full appearance-none rounded-md border border-muted-foreground/20 bg-background px-3 py-0 pr-8 text-sm leading-none text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            <option value="All">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}{c.uni_exclusive ? ' (Exclusive)' : ''}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={creatorType} onChange={e => setCreatorType(e.target.value)} className="h-9 w-full appearance-none rounded-md border border-muted-foreground/20 bg-background px-3 py-0 pr-8 text-sm leading-none text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            {['All', 'Teacher', 'Company', 'Club'].map(c => <option key={c} value={c}>{c === 'All' ? 'Creator Type' : c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={paymentType} onChange={e => setPaymentType(e.target.value)} className="h-9 w-full appearance-none rounded-md border border-muted-foreground/20 bg-background px-3 py-0 pr-8 text-sm leading-none text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            {['All', 'Free', 'Paid'].map(c => <option key={c} value={c}>{c === 'All' ? 'Free / Paid' : c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={eventStatus} onChange={e => setEventStatus(e.target.value)} className="h-9 w-full appearance-none rounded-md border border-muted-foreground/20 bg-background px-3 py-0 pr-8 text-sm leading-none text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            {['All', 'Completed', 'Active', 'Upcoming'].map(c => <option key={c} value={c}>{c === 'All' ? 'Status' : c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} disabled={eventStatus !== 'All'} className="h-9 w-full appearance-none rounded-md border border-muted-foreground/20 bg-background px-3 py-0 pr-8 text-sm leading-none text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            {['Most Attended', 'Newest', 'Upcoming Soon', 'Oldest', 'Price Low to High', 'Price High to Low'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Events Grid */}
            <div className="space-y-6">
                <div className="text-muted-foreground font-medium text-sm">Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}</div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredEvents.map(event => {
                        const isSaved = savedEventIds.includes(event.id);
                        return (
                            <Card key={event.id} className="border shadow-sm flex flex-col h-full hover:shadow-md transition-all hover:border-primary/30 group">
                                <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                                    <div className="flex flex-col items-start justify-between gap-2">
                                        <div className="flex w-full items-start justify-between">
                                            <Badge variant="outline" className="bg-background shadow-xs">
                                                {event.category_name}
                                            </Badge>
                                            <button onClick={() => toggleSave(event.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                                                <Heart className={`h-5 w-5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                                            </button>
                                        </div>
                                        <CardTitle className="text-xl font-bold line-clamp-2 mt-2 leading-tight group-hover:text-primary transition-colors">{event.title}</CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            {event.is_paid ?
                                                <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">PAID</Badge> :
                                                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">FREE</Badge>
                                            }
                                            {statusBadge(event)}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 flex-1">
                                    <div className="space-y-3 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-2 font-medium text-foreground/80"><User className="h-4 w-4" /> {event.creator_name || '—'}</span>
                                        <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {event.location}</span>
                                        <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(event.start_date)} • {event.start_time}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 pt-0 mt-auto border-t border-border/50 bg-muted/10 flex flex-col gap-3">
                                    <div className="w-full flex justify-between items-center mt-2">
                                        <span className="text-xs text-muted-foreground">By <span className="font-medium text-foreground">{event.creator_name || '—'}</span></span>
                                        {event.is_paid ? (
                                            <span className="text-xs font-semibold flex items-center gap-1 bg-background px-2 py-1 rounded-md text-foreground border border-border/50 shadow-sm">
                                                <Users className="h-3 w-3" /> Max: {event.max_seats || 'Unlimited'}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-semibold flex items-center gap-1 bg-background px-2 py-1 rounded-md text-foreground border border-border/50 shadow-sm">
                                                <Users className="h-3 w-3" /> {event.registration_count || 0}{event.max_seats ? ` / ${event.max_seats}` : ''}
                                            </span>
                                        )}
                                    </div>
                                    <Button className="w-full font-semibold" variant={event.is_paid ? "secondary" : "default"} onClick={() => setSelectedEvent(event)}>
                                        {event.is_paid ? (
                                            <>Visit Website <ArrowUpRight className="h-4 w-4 ml-2" /></>
                                        ) : (
                                            <>See and Apply</>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}

                    {filteredEvents.length === 0 && (
                        <div className="col-span-full border-dashed text-center py-16 px-4 border rounded-xl bg-muted/20">
                            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground mb-4">No events found matching your current filters.</p>
                            <Button variant="outline" onClick={() => {
                                setSearch(''); setCategory('All'); setCreatorType('All'); setPaymentType('All'); setEventStatus('All'); setSortBy('Most Attended'); setViewMode('all');
                            }}>Reset Filters</Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Event Detail Modal */}
            <Dialog open={selectedEvent !== null} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent className="sm:max-w-[620px] max-h-[85vh]">
                    {selectedEvent && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center justify-between gap-2">
                                    <DialogTitle className="text-2xl pr-8 line-clamp-2 leading-tight">{selectedEvent.title}</DialogTitle>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Badge variant="outline">{selectedEvent.category_name}</Badge>
                                    {selectedEvent.is_paid ?
                                        <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">PAID</Badge> :
                                        <Badge variant="secondary" className="bg-primary/10 text-primary">FREE</Badge>
                                    }
                                </div>
                            </DialogHeader>
                            <ScrollArea className="max-h-[50vh] pr-4 mt-2">
                                <div className="space-y-6 text-sm">
                                    <div>
                                        <h3 className="font-semibold text-base mb-2">About this event</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {selectedEvent.description || 'No detailed description provided for this event.'}
                                        </p>
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Creator</p>
                                            <p className="font-medium flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {selectedEvent.creator_name || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Location</p>
                                            <p className="font-medium flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {selectedEvent.location}</p>
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Date & Time</p>
                                            <div className="font-medium flex items-center gap-2 text-sm">
                                                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" /> 
                                                <div className="flex flex-col gap-1.5">
                                                    <span>Start: {formatDate(selectedEvent.start_date)} {selectedEvent.start_time ? `at ${selectedEvent.start_time}` : ''}</span>
                                                    <span>End: {formatDate(selectedEvent.end_date)} {selectedEvent.end_time ? `at ${selectedEvent.end_time}` : ''}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Registration</p>
                                            <p className="font-medium">
                                                {selectedEvent.is_paid ? `Paid (${selectedEvent.price} DZD)` : 'Free entry'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Created By</p>
                                            <p className="font-medium">{selectedEvent.creator_name || '—'}</p>
                                        </div>
                                        {selectedEvent.is_paid ? (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Capacity</p>
                                                <p className="font-medium flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" /> Max: {selectedEvent.max_seats || 'Unlimited'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Applicants</p>
                                                <p className="font-medium flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" /> {selectedEvent.registration_count || 0}{selectedEvent.max_seats ? ` / ${selectedEvent.max_seats}` : ''} Registered
                                                </p>
                                            </div>
                                        )}
                                        
                                        {!!selectedEvent.uni_exclusive && (
                                            <>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Responsible Lab</p>
                                                    <p className="font-medium flex items-center gap-2">
                                                        <Building className="h-4 w-4 text-muted-foreground" /> {selectedEvent.laboratory || '—'}
                                                    </p>
                                                </div>
                                                {(selectedEvent.organizers?.length > 0 || selectedEvent.reviewers?.length > 0) && (
                                                    <div className="col-span-2">
                                                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Supervisors</p>
                                                        <div className="grid sm:grid-cols-2 gap-2">
                                                            {selectedEvent.organizers?.map((org: string, i: number) => (
                                                                <p key={`org-${i}`} className="font-medium flex items-center gap-2 text-sm bg-muted/40 p-2 rounded-md border text-foreground/90">
                                                                    <User className="h-4 w-4 text-muted-foreground shrink-0" /> {org} <Badge variant="secondary" className="ml-auto text-[10px] shrink-0">Organizer</Badge>
                                                                </p>
                                                            ))}
                                                            {selectedEvent.reviewers?.map((rev: string, i: number) => (
                                                                <p key={`rev-${i}`} className="font-medium flex items-center gap-2 text-sm bg-muted/40 p-2 rounded-md border text-foreground/90">
                                                                    <User className="h-4 w-4 text-muted-foreground shrink-0" /> {rev} <Badge variant="secondary" className="ml-auto text-[10px] shrink-0">Reviewer</Badge>
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </ScrollArea>
                            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t">
                                <Button disabled={loadingActions[selectedEvent.id]} variant="outline" className="sm:mr-auto" onClick={() => toggleSave(selectedEvent.id)}>
                                    {loadingActions[selectedEvent.id] ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Heart className={`h-4 w-4 mr-2 ${savedEventIds.includes(selectedEvent.id) ? 'fill-red-500 text-red-500' : ''}`} />}
                                    {savedEventIds.includes(selectedEvent.id) ? 'Saved' : 'Save Event'}
                                </Button>
                                {selectedEvent.is_paid ? (
                                    <Button disabled={loadingActions[selectedEvent.id] || !isEventActive(selectedEvent)} onClick={() => handleVisitWebsite(selectedEvent.id, selectedEvent.join_url)}>
                                        {loadingActions[selectedEvent.id] ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : !isEventActive(selectedEvent) ? 'Too late' : <><ArrowUpRight className="h-4 w-4 mr-2" /> Visit Registration Website</>}
                                    </Button>
                                ) : (
                                    <Button
                                        disabled={loadingActions[selectedEvent.id] || appliedEventIds.includes(selectedEvent.id) || !isEventActive(selectedEvent) || (!!selectedEvent.max_seats && (selectedEvent.registration_count || 0) >= selectedEvent.max_seats)}
                                        onClick={() => handleApply(selectedEvent.id)}
                                        className={appliedEventIds.includes(selectedEvent.id) ? "bg-green-600 hover:bg-green-700 opacity-100 text-white" : ""}
                                    >
                                        {loadingActions[selectedEvent.id] ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : !isEventActive(selectedEvent) ? (
                                            'Too late'
                                        ) : appliedEventIds.includes(selectedEvent.id) ? (
                                            <><CheckCircle2 className="h-4 w-4 mr-2" /> Applied</>
                                        ) : !!selectedEvent.max_seats && (selectedEvent.registration_count || 0) >= selectedEvent.max_seats ? (
                                            'Event Full'
                                        ) : (
                                            'Apply Now'
                                        )}
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
}
