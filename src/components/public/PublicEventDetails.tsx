import { useState, useEffect } from 'react';
import { usePublicStore } from '../../contexts/PublicStoreContext';
import { api } from '../../services/api';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, MapPin, User, Users, ArrowLeft, Building, Presentation } from 'lucide-react';
import { toast } from 'sonner';

export function PublicEventDetails() {
    const { requireLogin, applyToEvent, appliedEventIds, currentEntityId, navigateTo } = usePublicStore();
    const [event, setEvent] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!currentEntityId) { setLoading(false); return; }
            try {
                // Fetch all events and find the one matching the ID
                const res = await api.events.get();
                if (res.success && Array.isArray(res.data)) {
                    const found = res.data.find((e: any) => String(e.id) === String(currentEntityId));
                    setEvent(found || null);
                }
            } catch (e) { console.error('Failed to fetch event', e); }
            setLoading(false);
        };
        fetchEvent();
    }, [currentEntityId]);

    if (loading) {
        return <div className="container mx-auto px-4 py-20 text-center"><p className="text-muted-foreground">Loading...</p></div>;
    }

    if (!event) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">Event Not Found</h1>
                <Button onClick={() => navigateTo('events')}>Back to Events</Button>
            </div>
        );
    }

    const applied = appliedEventIds.includes(event.id);

    const handleApply = () => {
        requireLogin(() => {
            applyToEvent(event.id);
            toast.success('Successfully applied to event!');
        });
    };

    const handleVisitWebsite = () => {
        requireLogin(() => {
            if (event.join_url) {
                window.open(event.join_url, '_blank');
            } else {
                toast.info('No website link available.');
            }
        });
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <Button variant="ghost" className="mb-6 -ml-4 hover:bg-transparent hover:text-primary transition-colors" onClick={() => navigateTo('events')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
            </Button>

            <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 md:p-12 border-b">
                    <div className="flex gap-2 mb-6">
                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm shadow-sm">{event.category_name || '—'}</Badge>
                        <Badge variant={event.is_paid ? 'secondary' : 'default'} className={!event.is_paid ? 'bg-primary/20 text-primary shadow-sm hover:bg-primary/30' : 'shadow-sm'}>
                            {event.is_paid ? 'PAID EVENT' : 'FREE EVENT'}
                        </Badge>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-balance">{event.title}</h1>
                    <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
                        {event.description}
                    </p>
                </div>

                <div className="p-8 md:p-12 grid md:grid-cols-5 gap-12">
                    <div className="md:col-span-3 space-y-10">
                        <div>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Presentation className="h-6 w-6 text-primary" /> Key Details
                            </h2>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/40 border border-muted/50 transition-colors hover:bg-muted/60">
                                    <div className="p-3 bg-background rounded-xl text-primary shadow-sm shrink-0">
                                        <Calendar className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Date & Time</p>
                                        <p className="text-muted-foreground mt-1">{event.start_date} to {event.end_date}</p>
                                        {event.start_time && <p className="text-muted-foreground">{event.start_time} - {event.end_time || 'End'}</p>}
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/40 border border-muted/50 transition-colors hover:bg-muted/60">
                                    <div className="p-3 bg-background rounded-xl text-primary shadow-sm shrink-0">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Location</p>
                                        <p className="text-muted-foreground mt-1">{event.location}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/40 border border-muted/50 transition-colors hover:bg-muted/60">
                                    <div className="p-3 bg-background rounded-xl text-primary shadow-sm shrink-0">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Creator / Host</p>
                                        <p className="text-muted-foreground mt-1">{event.creator_name || '—'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-8">
                        <div className="bg-card border shadow-sm rounded-3xl p-8 space-y-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

                            {event.is_paid ? (
                                <div>
                                    <p className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-widest text-[10px]">Capacity</p>
                                    <div className="text-5xl font-black flex items-center justify-center gap-3 drop-shadow-sm">
                                        <Users className="h-10 w-10 text-primary opacity-80" />
                                        <span className="tracking-tighter text-3xl">Max: {event.max_seats || 'Unlimited'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-widest text-[10px]">Current Attendance</p>
                                    <div className="text-5xl font-black flex items-center justify-center gap-3 drop-shadow-sm">
                                        <Users className="h-10 w-10 text-primary opacity-80" />
                                        <span className="tracking-tighter">{event.registration_count || 0}{event.max_seats ? <span className="text-3xl text-muted-foreground opacity-50">/{event.max_seats}</span> : ''}</span>
                                    </div>
                                </div>
                            )}

                            <div className="pt-8 border-t">
                                {event.is_paid ? (
                                    <div className="space-y-4">
                                        <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">{event.price} DZD</p>
                                        <Button size="lg" className="w-full text-lg h-14 rounded-full shadow-sm" variant="secondary" onClick={handleVisitWebsite}>
                                            Visit Website to Join
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        size="lg"
                                        className="w-full text-lg h-14 rounded-full shadow-sm hover:scale-[1.02] transition-transform"
                                        disabled={applied || (!!event.max_seats && (event.registration_count || 0) >= event.max_seats)}
                                        onClick={handleApply}
                                    >
                                        {applied ? 'You are attending' : (!!event.max_seats && (event.registration_count || 0) >= event.max_seats) ? 'Event Full' : 'Apply for Free'}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="bg-muted/30 border rounded-3xl p-6 hover:bg-muted/50 transition-colors group">
                            <p className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest text-[10px] pl-2">Organized By</p>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-background border shadow-sm text-primary flex items-center justify-center font-bold text-2xl uppercase shrink-0 group-hover:scale-105 transition-transform">
                                    <Building className="h-6 w-6 opacity-50 absolute" />
                                    <span className="relative z-10 font-black">{(event.creator_name || 'C').charAt(0)}</span>
                                </div>
                                <div>
                                    <button onClick={() => navigateTo('creators')} className="font-bold text-lg hover:text-primary transition-colors block line-clamp-1 text-left">
                                        {event.creator_name || 'Unknown Creator'}
                                    </button>
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider mt-2 bg-background/50">
                                        {event.creator_role || 'creator'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
