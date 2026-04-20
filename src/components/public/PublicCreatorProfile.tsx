import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, MapPin, Mail, BookOpen, Users, Calendar, Heart, User, ArrowUpRight, CheckCircle2, Building, Loader2 } from 'lucide-react';
import { usePublicStore } from '../../contexts/PublicStoreContext';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

export function PublicCreatorProfile() {
    const { user, currentEntityId, requireLogin, followCreator, unfollowCreator, followedCreatorIds, applyToEvent, appliedEventIds, savedEventIds, saveEvent, unsaveEvent, navigateTo } = usePublicStore();
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [creator, setCreator] = useState<any | null>(null);
    const [creatorEvents, setCreatorEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingFollow, setLoadingFollow] = useState(false);
    const [followOffset, setFollowOffset] = useState(0);
    const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchData = async () => {
            if (!currentEntityId) { setLoading(false); return; }
            try {
                // Fetch creator user
                const usRes = await api.users.get({ id: String(currentEntityId) });
                if (usRes.success && Array.isArray(usRes.data) && usRes.data.length > 0) {
                    setCreator(usRes.data[0]);
                }
                // Fetch events by this creator
                const evRes = await api.events.get({ creator_id: String(currentEntityId) });
                if (evRes.success && Array.isArray(evRes.data)) {
                    setCreatorEvents(evRes.data);
                }
            } catch (e) { console.error('Failed to fetch creator profile', e); }
            setLoading(false);
        };
        fetchData();
    }, [currentEntityId]);

    if (loading) {
        return <div className="text-center py-20"><p className="text-muted-foreground">Loading...</p></div>;
    }

    if (!creator) {
        return (
            <div className="text-center py-20">
                <h1 className="text-3xl font-bold mb-4">Creator Not Found</h1>
                <Button onClick={() => navigateTo('creators')}>Back to Creators</Button>
            </div>
        );
    }

    const isFollowing = followedCreatorIds.includes(creator.id);
    const isSelf = user?.id === creator.id;
    const displayName = creator.full_name || creator.username || 'Unknown';
    const creatorRole = creator.role === 'team_leader' ? 'team-leader' : creator.role;

    // Sort creator events by newest first, then put most attended first
    let sortedDisplayEvents = [...creatorEvents].sort((a, b) => {
        const aDate = a.start_date && a.start_date.length > 10 ? a.start_date.substring(0, 10) : a.start_date;
        const bDate = b.start_date && b.start_date.length > 10 ? b.start_date.substring(0, 10) : b.start_date;
        return new Date(bDate + 'T00:00:00').getTime() - new Date(aDate + 'T00:00:00').getTime();
    });
    if (sortedDisplayEvents.length > 0) {
        const mostAttendedEvent = [...creatorEvents].sort((a, b) => (b.registration_count || 0) - (a.registration_count || 0))[0];
        sortedDisplayEvents = sortedDisplayEvents.filter(e => e.id !== mostAttendedEvent.id);
        sortedDisplayEvents.unshift(mostAttendedEvent);
    }


    const handleFollow = () => {
        requireLogin(async () => {
            setLoadingFollow(true);
            try {
                if (isFollowing) {
                    await unfollowCreator(creator.id);
                    setFollowOffset(prev => prev - 1);
                    toast.info('Unfollowed creator');
                } else {
                    await followCreator(creator.id);
                    setFollowOffset(prev => prev + 1);
                    toast.success('Following creator');
                }
            } catch (err) {
            } finally {
                setLoadingFollow(false);
            }
        });
    };

    const handleApply = (eventId: string | number) => {
        requireLogin(async () => {
            setLoadingActions(prev => ({...prev, [eventId]: true}));
            try {
                await applyToEvent(eventId);
                toast.success('Successfully applied to event!');
            } catch (err) {
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

    const toggleSave = (eventId: string | number) => {
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
        const dateOnly = dateStr && dateStr.length > 10 ? dateStr.substring(0, 10) : dateStr;
        return new Date(dateOnly + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isEventActive = (event: any) => {
        const ed = event.end_date && event.end_date.length > 10 ? event.end_date.substring(0, 10) : event.end_date;
        const eventEndDateTime = new Date(`${ed}T${event.end_time || '23:59:59'}`);
        return eventEndDateTime >= new Date();
    };

    const getEventStatus = (event: any) => {
        const now = new Date();
        const sd = event.start_date && event.start_date.length > 10 ? event.start_date.substring(0, 10) : event.start_date;
        const ed = event.end_date && event.end_date.length > 10 ? event.end_date.substring(0, 10) : event.end_date;
        const eventStart = new Date(`${sd}T${event.start_time || '00:00:00'}`);
        const eventEnd = new Date(`${ed}T${event.end_time || '23:59:59'}`);
        if (now < eventStart) return 'upcoming';
        if (now > eventEnd) return 'completed';
        return 'active';
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

    const getRoleGradient = (role: string) => {
        switch (role) {
            case 'teacher': return 'from-blue-500/30 to-blue-500/5';
            case 'company': return 'from-purple-500/30 to-purple-500/5';
            case 'team-leader': return 'from-amber-500/30 to-amber-500/5';
            default: return 'from-primary/30 to-primary/5';
        }
    };

    const getRoleTextColor = (role: string) => {
        switch (role) {
            case 'teacher': return 'text-blue-600 dark:text-blue-400';
            case 'company': return 'text-purple-600 dark:text-purple-400';
            case 'team-leader': return 'text-amber-600 dark:text-amber-400';
            default: return 'text-primary';
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'teacher': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300';
            case 'company': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300';
            case 'team-leader': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300';
            default: return '';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <Button variant="ghost" className="-ml-4 hover:bg-transparent hover:text-primary transition-colors" onClick={() => navigateTo('creators')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Creators
            </Button>

            {/* Top section: Main Profile (3/4) and Overview Stats (1/4) side-by-side on large screens */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Profile Header (3/4 on lg, full on md) */}
                <div className="bg-card border rounded-3xl overflow-hidden shadow-sm relative lg:w-3/4 flex-shrink-0">
                    <div className={`h-32 md:h-40 bg-gradient-to-r ${getRoleGradient(creatorRole)}`} />
                    <div className="px-8 pb-8 flex flex-col md:flex-row gap-6 relative z-10">
                        <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background bg-background flex items-center justify-center text-4xl font-bold shadow-lg -mt-12 md:-mt-16 shrink-0 ${getRoleTextColor(creatorRole)}`}>
                            {displayName.charAt(0)}
                        </div>

                        <div className="flex-1 -mt-2">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
                                    <Badge variant="outline" className={`uppercase tracking-wider ${getRoleBadgeColor(creatorRole)}`}>
                                        {creatorRole === 'team-leader' ? 'team' : creatorRole.replace('-', ' ')}
                                    </Badge>
                                </div>
                                {!isSelf && (
                                    <Button
                                        size="lg"
                                        disabled={loadingFollow}
                                        className="w-full md:w-auto rounded-full px-8 shadow-sm"
                                        variant={isFollowing ? "secondary" : "default"}
                                        onClick={handleFollow}
                                    >
                                        {loadingFollow ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </Button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-4 mt-6 text-sm text-muted-foreground">
                                {creator.faculty && (
                                    <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                                        <BookOpen className="h-4 w-4" /> {creator.faculty}
                                    </span>
                                )}
                                {creator.location && (
                                    <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                                        <MapPin className="h-4 w-4" /> {creator.location}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                                    <Mail className="h-4 w-4" /> {creator.email}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Sidebar (1/4 on lg, full on md) */}
                <div className="lg:w-1/4">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-lg">Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{(creator.follower_count || 0) + followOffset}</p>
                                    <p className="text-sm text-muted-foreground">Followers</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{creator.event_count || creatorEvents.length}</p>
                                    <p className="text-sm text-muted-foreground">Total Events</p>
                                </div>
                            </div>
                            {creatorRole === 'team-leader' && creator.leader_name && (
                                <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-base font-bold leading-tight">{creator.leader_name}</p>
                                        <p className="text-sm text-muted-foreground">Team Leader</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Events List */}
            <div className="space-y-6 mt-8">
                <h2 className="text-2xl font-bold">Events of this creator</h2>

                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedDisplayEvents.length > 0 ? sortedDisplayEvents.map((event, idx) => {
                        const isSaved = savedEventIds.includes(event.id);
                        const active = isEventActive(event);
                        const isMostAttended = idx === 0 && sortedDisplayEvents.length > 1; // Assuming it was unshifted to idx 0

                        return (
                            <Card key={event.id} className={`border shadow-sm flex flex-col h-full hover:shadow-md transition-all group relative ${isMostAttended ? 'ring-2 ring-primary border-transparent' : 'hover:border-primary/30'}`}>
                                {isMostAttended && (
                                    <Badge className="absolute -top-3 -right-3 z-10 shadow-sm bg-primary text-primary-foreground font-semibold px-3 py-1 text-xs">
                                        Most Attended 🔥
                                    </Badge>
                                )}
                                <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                                    <div className="flex flex-col items-start justify-between gap-2">
                                        <div className="flex w-full items-start justify-between">
                                            <Badge variant="outline" className="bg-background shadow-xs">
                                                {event.category_name}
                                            </Badge>
                                            <button onClick={(e) => { e.preventDefault(); toggleSave(event.id); }} className="text-muted-foreground hover:text-red-500 transition-colors">
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
                                    <Button
                                        className="w-full font-semibold"
                                        variant={event.is_paid ? "secondary" : "default"}
                                        onClick={() => setSelectedEvent(event)}
                                    >
                                        {event.is_paid ? (
                                            <>Visit Website <ArrowUpRight className="h-4 w-4 ml-2" /></>
                                        ) : (
                                            <>See and Apply</>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    }) : (
                        <div className="col-span-full border-dashed text-center py-16 px-4 border rounded-xl bg-muted/20">
                            <p className="text-muted-foreground font-medium">No events found for this creator.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Event Detail Modal (Reusing from PublicEvents) */}
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
                                                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Registrations</p>
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
        </div>
    );
}
