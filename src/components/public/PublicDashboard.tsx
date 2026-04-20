import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CalendarDays, Users, ArrowRight, Sparkles, MapPin, Calendar, Heart, ArrowUpRight, CheckCircle2, User, Building } from 'lucide-react';
import { usePublicStore } from '../../contexts/PublicStoreContext';
import { api } from '../../services/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function PublicDashboard() {
    const { user, appliedEventIds, followedCreatorIds, navigateTo, requireLogin, applyToEvent, savedEventIds, saveEvent, unsaveEvent } = usePublicStore();
    const [pendingRequest, setPendingRequest] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

    const [creatorUsername, setCreatorUsername] = useState('');
    const [creatorPassword, setCreatorPassword] = useState('');
    const [creatorConfirmPassword, setCreatorConfirmPassword] = useState('');

    const isPasswordMatch = creatorPassword === creatorConfirmPassword;
    const showPasswordError = creatorConfirmPassword.length > 0 && !isPasswordMatch;

    const [trendingEvents, setTrendingEvents] = useState<any[]>([]);
    const [topCreators, setTopCreators] = useState<any[]>([]);
    const [myEvents, setMyEvents] = useState<any[]>([]);
    const [followedEvents, setFollowedEvents] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const evRes = await api.events.get();
                if (evRes.success && Array.isArray(evRes.data)) {
                    const events = evRes.data;
                    // Trending: sort by registration count, take top 3
                    const sorted = [...events].sort((a: any, b: any) => (b.registration_count || 0) - (a.registration_count || 0));
                    setTrendingEvents(sorted.slice(0, 3));
                    // My applied events
                    setMyEvents(events.filter((e: any) => appliedEventIds.includes(e.id)));
                    // From followed creators
                    setFollowedEvents(events.filter((e: any) => e.creator_id && followedCreatorIds.includes(e.creator_id)));
                }
                // Top creators: fetch users who are creators
                const usRes = await api.users.get();
                if (usRes.success && Array.isArray(usRes.data)) {
                    const creators = usRes.data.filter((u: any) =>
                        (u.role === 'teacher' || u.role === 'company' || u.role === 'team_leader') &&
                        u.manage === 1
                    );
                    setTopCreators(creators.slice(0, 3));
                }
                // Check for pending creator requests if logged in
                if (user) {
                    const reqRes = await api.creatorRequests.get();
                    if (reqRes.success && Array.isArray(reqRes.data)) {
                        const myRequest = reqRes.data.find((r: any) =>
                            r.contact_email === user.email || r.requested_username === user.username
                        );
                        setPendingRequest(myRequest || null);
                    }
                }
            } catch (e) { console.error('Dashboard fetch error', e); }
        };
        fetchData();
    }, [appliedEventIds, followedCreatorIds, user]);

    const handleApply = (eventId: string) => {
        requireLogin(() => {
            applyToEvent(eventId);
            toast.success('Successfully applied to event!');
        });
    };

    const handleVisitWebsite = async (eventId: string, url?: string) => {
        if (url) {
            try {
                await api.eventRedirects.create({ event_id: String(eventId), user_id: user ? String(user.id) : undefined });
            } catch (err) {
                console.error('Failed to log redirect', err);
            }
            window.open(url, '_blank');
        } else {
            toast.info('No website link available.');
        }
    };

    const toggleSave = (eventId: string) => {
        requireLogin(() => {
            if (savedEventIds.includes(eventId)) {
                unsaveEvent(eventId);
                toast.success('Removed from favorites.');
            } else {
                saveEvent(eventId);
                toast.success('Added to favorites.');
            }
        });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const toDateOnly = (d: string) => {
        if (!d) return '';
        if (d.length === 10) return d;
        return d.substring(0, 10);
    };

    const isEventActive = (event: any) => {
        const ed = toDateOnly(event.end_date);
        const eventEndDateTime = new Date(`${ed}T${event.end_time || '23:59:59'}`);
        return eventEndDateTime >= new Date();
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-12">
            {/* Hero Section */}
            <section className="text-center py-20 px-4 bg-primary/5 rounded-[2.5rem] border border-primary/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-foreground">
                        University Events, <span className="text-primary block sm:inline">Simplified</span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                        Discover workshops, conferences, and club activities. Connect with top teachers, companies, and student leaders in one unified platform.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button size="lg" className="h-14 px-8 text-lg rounded-full" onClick={() => navigateTo('events')}>
                            Browse Events <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full bg-background" onClick={() => navigateTo('creators')}>
                            Find Creators
                        </Button>
                        {(!user || (user.role === 'teacher' && !user.manage)) && (
                            <Button
                                variant="secondary"
                                size="lg"
                                className="h-14 px-8 text-lg rounded-full font-semibold border border-primary/20 hover:bg-primary/10"
                                onClick={() => !pendingRequest && setIsCreatorModalOpen(true)}
                                disabled={!!pendingRequest}
                            >
                                <Sparkles className="mr-2 h-5 w-5 text-primary" />
                                {pendingRequest ? 'Request In Progress' : 'Become a Creator'}
                            </Button>
                        )}
                    </div>
                </div>
            </section>

            {user ? (
                /* Logged In Dashboard */
                <div className="space-y-12">
                    <div className="grid grid-cols-2 gap-4 sm:gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-muted-foreground text-sm font-medium">Applied Events</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{appliedEventIds.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-muted-foreground text-sm font-medium">Followed Creators</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{followedCreatorIds.length}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <CalendarDays className="h-6 w-6 text-primary" /> Upcoming Applied
                                </h2>
                                <Button variant="link" onClick={() => navigateTo('history')}>View All</Button>
                            </div>
                            <div className="space-y-4">
                                {myEvents.length > 0 ? myEvents.map(event => (
                                    <Card key={event.id} className="hover:border-primary/50 transition-colors">
                                        <CardContent className="p-4 flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold">{event.title}</h3>
                                                <p className="text-sm text-muted-foreground">{event.start_date}</p>
                                            </div>
                                            <Button variant="secondary" size="sm" onClick={() => setSelectedEvent(event)}>
                                                View
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )) : (
                                    <Card className="bg-muted/50 border-dashed">
                                        <CardContent className="p-8 text-center text-muted-foreground">
                                            No applied events yet. <button onClick={() => navigateTo('events')} className="text-primary hover:underline font-medium focus:outline-none">Browse events</button>.
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Users className="h-6 w-6 text-primary" /> From Followed Creators
                            </h2>
                            <div className="space-y-4">
                                {followedEvents.length > 0 ? followedEvents.map(event => (
                                    <Card key={event.id} className="hover:border-primary/50 transition-colors">
                                        <CardContent className="p-4 flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold">{event.title}</h3>
                                                <p className="text-sm text-muted-foreground">By {event.creator_name || '—'}</p>
                                            </div>
                                            <Button variant="secondary" size="sm" onClick={() => setSelectedEvent(event)}>
                                                View
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )) : (
                                    <Card className="bg-muted/50 border-dashed">
                                        <CardContent className="p-8 text-center text-muted-foreground">
                                            No events from followed creators yet. <button onClick={() => navigateTo('creators')} className="text-primary hover:underline font-medium focus:outline-none">Find creators</button>.
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Guest Dashboard */
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold flex items-center gap-2">
                            <CalendarDays className="h-7 w-7 text-primary" /> Trending Events
                        </h2>
                        <div className="grid gap-4">
                            {trendingEvents.map(event => (
                                <Card key={event.id} className="group hover:-translate-y-1 transition-all duration-300 hover:shadow-lg border-muted cursor-pointer" onClick={() => setSelectedEvent(event)}>
                                    <CardContent className="p-6 flex justify-between items-center">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant={event.is_paid ? 'secondary' : 'default'} className="bg-primary/10 text-primary hover:bg-primary/20">
                                                    {event.is_paid ? 'PAID' : 'FREE'}
                                                </Badge>
                                                {event.is_paid ? (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Users className="h-3 w-3" /> Max: {event.max_seats || 'Unlimited'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Users className="h-3 w-3" /> {event.registration_count || 0}{event.max_seats ? ` / ${event.max_seats}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{event.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-1">{event.description}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full" onClick={() => navigateTo('events')}>
                            See All Events <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold flex items-center gap-2">
                            <Users className="h-7 w-7 text-primary" /> Top Creators
                        </h2>
                        <div className="grid gap-4">
                            {topCreators.map(creator => (
                                <Card key={creator.id} className="group hover:-translate-y-1 transition-all duration-300 hover:shadow-lg border-muted">
                                    <CardContent className="p-6 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl uppercase">
                                            {(creator.full_name || creator.username || 'C').charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{creator.full_name || creator.username}</h3>
                                            <p className="text-sm text-muted-foreground capitalize">{creator.role}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {creator.event_count || 0} Events • {creator.follower_count || 0} Followers
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full" onClick={() => navigateTo('creators')}>
                            Explore Creators <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Become Creator Modal */}
            <Dialog open={isCreatorModalOpen} onOpenChange={setIsCreatorModalOpen}>
                <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Become a Creator</DialogTitle>
                        <DialogDescription>
                            {user?.role === 'teacher'
                                ? "As a teacher, you can request to become a creator to host academic events. Please confirm your identity."
                                : "Submit your application to become an official creator on UniConnect and start hosting events."}
                        </DialogDescription>
                        {user?.role !== 'teacher' && (
                            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800 mt-2">
                                <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                                    <strong>Note for Teachers:</strong> If you are a teacher, please log in to your account before applying to simplify the process.
                                </p>
                            </div>
                        )}
                    </DialogHeader>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (user?.role !== 'teacher' && !isPasswordMatch) {
                            toast.error('Passwords do not match');
                            return;
                        }

                        setIsSubmitting(true);
                        try {
                            const guestEmail = (document.getElementById('contact-email') as HTMLInputElement)?.value;
                            const isUnivEmail = guestEmail?.toLowerCase().includes('univ') || guestEmail?.toLowerCase().includes('edu') || user?.email?.toLowerCase().includes('univ') || user?.email?.toLowerCase().includes('edu');

                            const formData = user?.role === 'teacher' ? {
                                role: 'teacher',
                                entity_name: user.affiliation || 'University Faculty',
                                representative_name: user.name,
                                contact_email: user.email,
                                requested_username: user.username,
                                password: creatorPassword,
                                location: 'University Campus',
                                description: 'Teacher looking to organize academic sessions.'
                            } : {
                                role: isUnivEmail ? 'teacher' : 'company',
                                entity_name: (document.getElementById('company-name') as HTMLInputElement).value,
                                representative_name: (document.getElementById('rep-name') as HTMLInputElement).value,
                                contact_email: guestEmail,
                                requested_username: creatorUsername,
                                password: creatorPassword,
                                location: (document.getElementById('location') as HTMLInputElement).value,
                                description: (document.getElementById('reason') as HTMLTextAreaElement).value
                            };

                            const res = await api.creatorRequests.create(formData);
                            if (res.success) {
                                toast.success('Your request has been submitted. The admin will review it and notify you.');
                                setIsCreatorModalOpen(false);
                                setPendingRequest({ ...formData, id: (res.data as any)?.id });
                            } else {
                                toast.error(res.message || 'Failed to submit request.');
                            }
                        } catch (err) {
                            toast.error('An error occurred.');
                        } finally {
                            setIsSubmitting(false);
                        }
                    }}>
                        <div className="grid gap-4 py-4">
                            {!user ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="company-name">Company / Team Name</Label>
                                        <Input id="company-name" placeholder="e.g. Sonatrach or Alpha Team" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rep-name">Representative Name</Label>
                                        <Input id="rep-name" placeholder="Name of contact person" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact-email">Contact Email</Label>
                                        <Input id="contact-email" type="email" placeholder="Enter email address" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="location">Location</Label>
                                        <Input id="location" placeholder="e.g. Algiers HQ / Lab 3" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reason">Description / Reason for joining</Label>
                                        <Textarea id="reason" placeholder="Briefly describe what kind of events you want to host." rows={3} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="username">Username</Label>
                                        <Input id="username" placeholder="Choose a username" value={creatorUsername} onChange={(e) => setCreatorUsername(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" type="password" placeholder="Create a password" value={creatorPassword} onChange={(e) => setCreatorPassword(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm Password</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            placeholder="Confirm password"
                                            value={creatorConfirmPassword}
                                            onChange={(e) => setCreatorConfirmPassword(e.target.value)}
                                            className={showPasswordError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                            required
                                        />
                                        {showPasswordError && (
                                            <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="t-password">Confirm your Password</Label>
                                        <Input id="t-password" type="password" placeholder="Enter your password to confirm" value={creatorPassword} onChange={(e) => setCreatorPassword(e.target.value)} required />
                                    </div>
                                </>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="w-full bg-gradient-to-br from-blue-600 to-purple-700" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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
                                            <p className="font-medium flex flex-col gap-1.5 text-sm">
                                                <span className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" /> 
                                                    Start: {formatDate(selectedEvent.start_date)} {selectedEvent.start_time ? `at ${selectedEvent.start_time}` : ''}
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-transparent shrink-0" /> 
                                                    End: {formatDate(selectedEvent.end_date)} {selectedEvent.end_time ? `at ${selectedEvent.end_time}` : ''}
                                                </span>
                                            </p>
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
                                        
                                        {selectedEvent.uni_exclusive && (
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
                                <Button variant="outline" className="sm:mr-auto" onClick={() => toggleSave(selectedEvent.id)}>
                                    <Heart className={`h-4 w-4 mr-2 ${savedEventIds?.includes(selectedEvent.id) ? 'fill-red-500 text-red-500' : ''}`} />
                                    {savedEventIds?.includes(selectedEvent.id) ? 'Saved' : 'Save Event'}
                                </Button>
                                {selectedEvent.is_paid ? (
                                    <Button disabled={!isEventActive(selectedEvent)} onClick={() => handleVisitWebsite(selectedEvent.id, selectedEvent.join_url)}>
                                        {!isEventActive(selectedEvent) ? 'Too late' : <><ArrowUpRight className="h-4 w-4 mr-2" /> Visit Registration Website</>}
                                    </Button>
                                ) : (
                                    <Button
                                        disabled={appliedEventIds?.includes(selectedEvent.id) || !isEventActive(selectedEvent) || (!!selectedEvent.max_seats && (selectedEvent.registration_count || 0) >= selectedEvent.max_seats)}
                                        onClick={() => handleApply(selectedEvent.id)}
                                        className={appliedEventIds?.includes(selectedEvent.id) ? "bg-green-600 hover:bg-green-700 opacity-100 text-white" : ""}
                                    >
                                        {!isEventActive(selectedEvent) ? (
                                            'Too late'
                                        ) : appliedEventIds?.includes(selectedEvent.id) ? (
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
