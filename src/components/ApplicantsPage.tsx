import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
    Search, FileDown, Calendar, MapPin, Mic, Users, CreditCard, CheckCircle2, Clock,
    Filter, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, ShieldCheck, ChevronUp, ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { exportEventApplicantsPDF } from '../utils/pdfExport';

interface ApplicantsPageProps {
    role: 'admin' | 'team-leader' | 'teacher' | 'company';
    currentUser?: any;
}

type SortDir = 'asc' | 'desc';
type ApplicantSortField = 'name' | 'date' | 'amount';


function EventBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        upcoming: 'text-orange-600 border-orange-200 bg-orange-50',
        active: 'text-green-600 border-green-200 bg-green-50',
        completed: 'text-blue-600 border-blue-200 bg-blue-50',
    };
    return <Badge variant="outline" className={map[status] || 'text-gray-600 border-gray-200 bg-gray-50'}>{status}</Badge>;
}

export function ApplicantsPage({ role, currentUser }: ApplicantsPageProps) {
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [selected, setSelected] = useState<any | null>(null);
    const [search, setSearch] = useState('');

    // Filters
    const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [creatorFilter, setCreatorFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Event list sorting
    const [eventSortValue, setEventSortValue] = useState<string>('date-desc');

    // Applicant detail sorting
    const [appSortField, setAppSortField] = useState<ApplicantSortField>('date');
    const [appSortDir, setAppSortDir] = useState<SortDir>('desc');

    const roleColor: Record<string, string> = {
        admin: 'text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
        'team-leader': 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
        teacher: 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
        company: 'text-red-600 border-red-200 bg-red-50 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    };

    const formatDate = (d: string) => {
        const dateOnly = d && d.length > 10 ? d.substring(0, 10) : d;
        return new Date(dateOnly + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    const formatDateTime = (d: string) => {
        const dateOnly = d && d.length > 10 ? d.substring(0, 10) : d;
        return new Date(dateOnly + 'T00:00:00').toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    const isUpcoming = (e: any) => {
        const sd = e.start_date && e.start_date.length > 10 ? e.start_date.substring(0, 10) : e.start_date;
        return new Date(sd + 'T00:00:00') > new Date();
    };

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const params: any = {};
                if (role !== 'admin' && currentUser?.id) params.creator_id = currentUser.id;
                const res = await api.events.get(params);
                if (res.success && Array.isArray(res.data)) setAllEvents(res.data);
            } catch (e) { console.error('Failed to fetch events', e); }
        };
        fetchEvents();
    }, [role, currentUser]);

    // Stats calculations
    const totalRegistrations = allEvents.reduce((s, e) => s + (e.registration_count || 0), 0);
    const totalPaid = allEvents.filter(e => e.is_paid).length;
    const totalFree = allEvents.filter(e => !e.is_paid).length;


    // Toggle applicant sort
    const toggleAppSort = (field: string) => {
        const f = field as ApplicantSortField;
        if (appSortField === f) setAppSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setAppSortField(f); setAppSortDir('asc'); }
    };

    const displayEvents = useMemo(() => {
        let base = allEvents.filter(e => {
            if (statusFilter === 'upcoming' && !isUpcoming(e)) return false;
            if (statusFilter === 'completed' && isUpcoming(e)) return false;
            if (categoryFilter !== 'all' && e.category_name !== categoryFilter) return false;
            if (role === 'admin' && creatorFilter !== 'all' && e.creator_role !== creatorFilter) return false;
            if (typeFilter === 'paid' && !e.is_paid) return false;
            if (typeFilter === 'free' && e.is_paid) return false;
            return true;
        });

        base = [...base].sort((a, b) => {
            const [field, dir] = eventSortValue.split('-');
            let av: number | string = 0, bv: number | string = 0;
            if (field === 'title') { av = a.title.toLowerCase(); bv = b.title.toLowerCase(); }
            else { av = a.start_date; bv = b.start_date; }
            if (av < bv) return dir === 'asc' ? -1 : 1;
            if (av > bv) return dir === 'asc' ? 1 : -1;
            return 0;
        });

        return base;
    }, [allEvents, statusFilter, categoryFilter, creatorFilter, typeFilter, eventSortValue, role]);

    const openDetail = (event: any) => {
        setSelected(event);
        setSearch('');
        if (event.is_paid) setDetailTab('paid');
        else setDetailTab('free');
    };

    const [detailTab, setDetailTab] = useState<'free' | 'paid'>('free');
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [redirects, setRedirects] = useState<any[]>([]);

    useEffect(() => {
        if (!selected) { setRegistrations([]); setRedirects([]); return; }
        const fetchDetail = async () => {
            try {
                if (!selected.is_paid) {
                    const res = await api.eventRegistrations.get({ event_id: selected.id });
                    if (res.success && Array.isArray(res.data)) setRegistrations(res.data);
                } else {
                    const res = await api.eventRedirects.get({ event_id: selected.id });
                    if (res.success && Array.isArray(res.data)) setRedirects(res.data);
                }
            } catch (e) { console.error('Failed to fetch applicant details', e); }
        };
        fetchDetail();
    }, [selected]);

    const filteredFree = useMemo(() => {
        if (!selected || selected.is_paid) return [];
        return registrations
            .filter(a => (a.full_name || a.username || '').toLowerCase().includes(search.toLowerCase()) || (a.email || '').toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => {
                let av: string | number = '', bv: string | number = '';
                if (appSortField === 'name') { av = (a.full_name || a.username || '').toLowerCase(); bv = (b.full_name || b.username || '').toLowerCase(); }
                else { av = a.registered_at || ''; bv = b.registered_at || ''; }
                if (av < bv) return appSortDir === 'asc' ? -1 : 1;
                if (av > bv) return appSortDir === 'asc' ? 1 : -1;
                return 0;
            });
    }, [selected, registrations, search, appSortField, appSortDir]);

    const filteredPaid = useMemo(() => {
        if (!selected || !selected.is_paid) return [];
        return redirects
            .filter(p => (p.full_name || p.username || '').toLowerCase().includes(search.toLowerCase()) || (p.email || '').toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => {
                let av: string | number = '', bv: string | number = '';
                if (appSortField === 'name') { av = (a.full_name || a.username || '').toLowerCase(); bv = (b.full_name || b.username || '').toLowerCase(); }
                else { av = a.redirected_at || ''; bv = b.redirected_at || ''; }
                if (av < bv) return appSortDir === 'asc' ? -1 : 1;
                if (av > bv) return appSortDir === 'asc' ? 1 : -1;
                return 0;
            });
    }, [selected, redirects, search, appSortField, appSortDir]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Applicants</h1>
                <p className="text-muted-foreground mt-1">View and export registration logs for your events</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(role === 'admin' ? [
                    {
                        title: 'Active & Upcoming',
                        value: allEvents.filter(e => isUpcoming(e)).length.toString(),
                        sub: 'Events needing attention',
                        icon: Calendar,
                        color: 'text-blue-600',
                        bg: 'bg-blue-50 dark:bg-blue-900/20'
                    },
                    {
                        title: 'Paid Events',
                        value: totalPaid.toString(),
                        sub: 'Revenue generating',
                        icon: CreditCard,
                        color: 'text-orange-600',
                        bg: 'bg-orange-50 dark:bg-orange-900/20'
                    },
                    {
                        title: 'Free Events',
                        value: totalFree.toString(),
                        sub: 'Community engagement',
                        icon: Users,
                        color: 'text-green-600',
                        bg: 'bg-green-50 dark:bg-green-900/20'
                    },
                ] : [
                    { title: 'Total Registrations', value: totalRegistrations.toString(), sub: 'Total signups', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { title: 'Paid Events', value: totalPaid.toString(), sub: 'Paid events count', icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                    { title: 'Free Events', value: totalFree.toString(), sub: 'Free events count', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                ]).map((stat) => (
                    <Card key={stat.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground">{stat.title}</CardTitle>
                            <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters & Sorting */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Filter */}
                    <div className="bg-muted p-1 rounded-lg inline-flex">
                        {(['all', 'upcoming', 'completed'] as const).map(f => (
                            <Button key={f} variant={statusFilter === f ? 'default' : 'ghost'} size="sm"
                                className={`text-xs capitalize ${statusFilter !== f ? 'hover:bg-transparent' : ''}`} onClick={() => setStatusFilter(f)}>
                                {f === 'all' ? 'All' : f === 'upcoming' ? 'Active' : 'Past'}
                            </Button>
                        ))}
                    </div>

                    {/* Category Filter */}
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {['Workshop', 'Conference', 'Open Day', 'Special'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    {/* Creator Filter - ADMIN ONLY */}
                    {role === 'admin' && (
                        <Select value={creatorFilter} onValueChange={setCreatorFilter}>
                            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Creator" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Creators</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="company">Company</SelectItem>
                                <SelectItem value="team-leader">Club (Team)</SelectItem>
                                <SelectItem value="admin">University (Admin)</SelectItem>
                            </SelectContent>
                        </Select>
                    )}

                    {/* Type Filter */}
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                    </Select>
                    {/* Sort */}
                    <Select value={eventSortValue} onValueChange={setEventSortValue}>
                        <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Sort" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date-desc">Date (Newest)</SelectItem>
                            <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                            <SelectItem value="title-asc">Name (A→Z)</SelectItem>
                            <SelectItem value="title-desc">Name (Z→A)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Events list */}
            <div className="space-y-3">
                {displayEvents.map(event => {
                    const pct = event.max_seats ? Math.min(100, Math.round(((event.registration_count || 0) / event.max_seats) * 100)) : null;

                    return (
                        <Card key={event.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <CardTitle className="text-lg font-medium">{event.title}</CardTitle>
                                            <EventBadge status={isUpcoming(event) ? 'upcoming' : 'completed'} />
                                            <Badge variant="secondary" className="text-xs">{event.category_name}</Badge>
                                            {event.is_paid ?
                                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-200 bg-orange-50">Paid</Badge> :
                                                <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">Free</Badge>
                                            }
                                            {role === 'admin' && event.creator_role && (
                                                <Badge variant="outline" className={`text-xs capitalize ${roleColor[event.creator_role.toLowerCase()] || ''}`}>
                                                    <ShieldCheck className="h-3 w-3 mr-1" />{event.creator_role}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1"><Mic className="h-3 w-3" />{event.creator_name || '—'}</span>
                                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(event.start_date)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <Separator className="mb-3" />
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">
                                                {event.registration_count || 0}
                                                {event.max_seats && <span className="text-base font-normal text-muted-foreground"> / {event.max_seats}</span>}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{event.max_seats ? 'seats filled' : (event.is_paid ? 'visits' : 'registered')}</p>
                                        </div>
                                        {pct !== null && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-orange-500' : 'bg-blue-500'
                                                            }`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground">{pct}%</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => openDetail(event)}>View</Button>
                                        <Button size="sm" variant="secondary" className="flex-1 sm:flex-none gap-1" onClick={() => exportEventApplicantsPDF(event)}>
                                            <FileDown className="h-3.5 w-3.5" />PDF
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {displayEvents.length === 0 && (
                    <Card className="border-0 shadow-sm">
                        <CardContent className="flex items-center justify-center p-12">
                            <div className="text-center space-y-2">
                                <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                                <p className="text-muted-foreground font-medium">No applicants found</p>
                                <p className="text-sm text-muted-foreground">
                                    {typeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all' ? 'No events match your filters.' : 'Registrations will appear here once people apply to your events.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Detail Dialog */}
            <Dialog open={selected !== null} onOpenChange={() => { setSelected(null); setSearch(''); }}>
                <DialogContent className="sm:max-w-[760px] max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
                    {selected && (
                        <>
                            <DialogHeader className="px-6 pt-6 pb-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <DialogTitle className="text-xl">{selected.title}</DialogTitle>
                                    {selected.is_paid ?
                                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Paid Event</Badge> :
                                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Free Event</Badge>
                                    }
                                </div>
                                <DialogDescription>
                                    <span className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                                        <span className="flex items-center gap-1"><Mic className="h-3.5 w-3.5" />{selected.creator_name || '—'}</span>
                                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selected.location}</span>
                                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(selected.start_date)}</span>
                                    </span>
                                </DialogDescription>
                            </DialogHeader>

                            {/* Sort row */}
                            <div className="px-6 pb-3 flex flex-wrap items-center justify-between gap-3">
                                <div className="text-sm font-medium text-foreground">
                                    {selected.is_paid ? 'Payment Page Visits' : 'Registered Applicants'}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <ArrowUpDown className="h-3.5 w-3.5" />
                                    {[
                                        { field: 'date', label: 'Date' },
                                        { field: 'name', label: 'Name' },
                                    ].map(({ field, label }) => (
                                        <button
                                            key={field}
                                            onClick={() => toggleAppSort(field)}
                                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${appSortField === field
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                : 'hover:bg-muted'}`}
                                        >
                                            {label}
                                            {appSortField === field && (appSortDir === 'asc' ? <ArrowUp className="inline h-3 w-3 ml-0.5" /> : <ArrowDown className="inline h-3 w-3 ml-0.5" />)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Search */}
                            <div className="px-6 pb-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search by name or email..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
                                </div>
                            </div>

                            <Separator />

                            <ScrollArea className="flex-1 px-6 py-4">
                                {/* FREE tab content */}
                                {!selected.is_paid && (
                                    <div className="space-y-2">
                                        {filteredFree.length === 0 && <div className="text-center text-muted-foreground py-8">No applicants found</div>}
                                        {filteredFree.map((a, idx) => (
                                            <div key={a.id || idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                                <div className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0">{idx + 1}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{a.full_name || a.username || '—'}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{a.email || '—'}</p>
                                                </div>
                                                <div className="text-xs text-muted-foreground flex-shrink-0">{a.registered_at ? formatDateTime(a.registered_at) : '—'}</div>
                                                <Badge variant="outline" className="text-xs flex-shrink-0 text-green-700 border-green-200 bg-green-50">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />Registered
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* PAID tab content */}
                                {selected.is_paid && (
                                    <div className="space-y-2">
                                        {filteredPaid.length === 0 && <div className="text-center text-muted-foreground py-8">No redirect logs found</div>}
                                        {filteredPaid.map((p, idx) => (
                                            <div key={p.id || idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                                <div className="w-7 h-7 flex items-center justify-center rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex-shrink-0">{idx + 1}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{p.full_name || p.username || '—'}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{p.email || '—'}</p>
                                                </div>
                                                <div className="text-xs text-muted-foreground flex-shrink-0">
                                                    <p>{p.redirected_at ? formatDateTime(p.redirected_at) : '—'}</p>
                                                </div>
                                                <Badge variant="outline" className="text-xs flex-shrink-0 text-orange-700 border-orange-200 bg-orange-50">
                                                    <ExternalLink className="h-3 w-3 mr-1" />Visited URL
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>

                            <Separator />
                            <div className="px-6 py-4 flex justify-between items-center">
                                <Button size="sm" variant="secondary" className="gap-1" onClick={() => exportEventApplicantsPDF(selected)}>
                                    <FileDown className="h-4 w-4" />Export PDF
                                </Button>
                                <Button variant="outline" onClick={() => { setSelected(null); setSearch(''); }}>Close</Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
}
