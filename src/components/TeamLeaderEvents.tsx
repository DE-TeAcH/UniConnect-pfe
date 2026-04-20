import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import {
    Calendar, MapPin, Mic, Users, Plus, Trash2, Eye, ChevronDown, ChevronUp,
    Link, FileDown, ArrowUp, ArrowDown, ArrowUpDown, Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { exportEventApplicantsPDF } from '../utils/pdfExport';
import { toast } from 'sonner';

interface TeamLeaderEventsProps { currentUser: any; }

const emptyForm = () => ({
    title: '', description: '', location: '',
    startDate: '', startTime: '', endDate: '', endTime: '', maxSeats: 0, isPaid: false, price: 0, joinUrl: '', category: '',
    reviewers: [] as string[],
    organizers: [] as string[],
    proofOfAccess: '',
    proofOfAccessBase64: '',
    laboratory: ''
});

function EventBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        upcoming: 'text-orange-600 border-orange-200 bg-orange-50',
        active: 'text-green-600 border-green-200 bg-green-50',
        completed: 'text-blue-600 border-blue-200 bg-blue-50',
    };
    return <Badge variant="outline" className={map[status] || 'text-gray-600 border-gray-200 bg-gray-50'}>{status}</Badge>;
}

export function TeamLeaderEvents({ currentUser }: TeamLeaderEventsProps) {
    const [events, setEvents] = useState<any[]>([]);
    const [form, setForm] = useState(emptyForm());
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<'upcoming' | 'completed'>('upcoming');
    const [sortField, setSortField] = useState<'date' | 'title' | 'attendees'>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [newReviewer, setNewReviewer] = useState('');
    const [newOrganizer, setNewOrganizer] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [loadingActionIds, setLoadingActionIds] = useState<Record<string, boolean>>({});
    const [isExportingMap, setIsExportingMap] = useState<Record<string, boolean>>({});

    const [categories, setCategories] = useState<any[]>([]);

    const fetchEvents = async () => {
        try {
            const res = await api.events.get({ creator_id: currentUser?.id });
            if (res.success && Array.isArray(res.data)) setEvents(res.data);
        } catch (e) { console.error('Failed to fetch events', e); }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.eventCategories.get();
            if (res.success && Array.isArray(res.data)) setCategories(res.data);
        } catch (e) { console.error('Failed to fetch categories', e); }
    };

    useEffect(() => {
        fetchEvents();
        fetchCategories();
    }, [currentUser]);

    const formatDate = (d: string) => {
        const dateOnly = d && d.length > 10 ? d.substring(0, 10) : d;
        return new Date(dateOnly + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    const isUpcoming = (e: any) => {
        const sd = e.start_date && e.start_date.length > 10 ? e.start_date.substring(0, 10) : e.start_date;
        return new Date(sd + 'T00:00:00') > new Date();
    };
    const filtered = events
        .filter(e => filter === 'upcoming' ? isUpcoming(e) : !isUpcoming(e))
        .sort((a, b) => {
            let av: string | number = 0, bv: string | number = 0;
            if (sortField === 'title') { av = a.title.toLowerCase(); bv = b.title.toLowerCase(); }
            else if (sortField === 'attendees') { av = a.registration_count || 0; bv = b.registration_count || 0; }
            else { av = a.start_date; bv = b.start_date; }
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

    const handleSave = async () => {
        if (!form.title || !form.startDate || !form.endDate || !form.location) {
            toast.error('Please fill in all required fields.');
            return;
        }
        if (new Date(form.startDate) > new Date(form.endDate)) {
            toast.error('End date cannot be before start date.');
            return;
        }
        if (form.startDate === form.endDate && form.startTime && form.endTime && form.startTime > form.endTime) {
            toast.error('End time cannot be before start time.');
            return;
        }
        if (!form.proofOfAccess) {
            toast.error('Proof document (PDF) is required.');
            return;
        }
        setIsSaving(true);
        try {
            const payload: any = {
                title: form.title, description: form.description, location: form.location,
                start_date: form.startDate, start_time: form.startTime, end_date: form.endDate, end_time: form.endTime,
                capacity: form.maxSeats || null, price_type: form.isPaid ? 'paid' : 'free', price: form.isPaid ? form.price : 0,
                website: form.joinUrl || null, category_id: form.category, creator_id: currentUser?.id,
                reviewers: form.reviewers, organizers: form.organizers, laboratory: form.laboratory
            };
            if (form.proofOfAccessBase64) {
                payload.pdf_file = form.proofOfAccessBase64;
            }
            if (editingId) {
                const res = await api.events.update({ id: editingId, ...payload });
                if (res.success) { toast.success('Event updated.'); fetchEvents(); }
                else toast.error(res.message);
            } else {
                const res = await api.events.create(payload);
                if (res.success) { toast.success('Event created.'); fetchEvents(); }
                else toast.error(res.message);
            }
        } catch (e) { toast.error('Server error.'); }
        finally { setIsSaving(false); }
        setIsOpen(false); setForm(emptyForm()); setEditingId(null);
    };

    const handleEdit = (e: any) => {
        setForm({
            title: e.title, description: e.description || '', location: e.location,
            startDate: e.start_date, startTime: e.start_time || '', endDate: e.end_date, endTime: e.end_time || '',
            maxSeats: e.capacity || 0, isPaid: e.price_type === 'paid', price: e.price || 0, joinUrl: e.website || '',
            category: e.category_id || '',
            reviewers: e.reviewers || [], organizers: e.organizers || [],
            proofOfAccess: e.pdf_file ? 'attached' : '',
            proofOfAccessBase64: '',
            laboratory: e.laboratory || ''
        });
        setEditingId(e.id); setIsOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this event?')) return;
        setLoadingActionIds(p => ({...p, [`del_${id}`]: true}));
        try {
            const res = await api.events.delete(id);
            if (res.success) { toast.success('Event deleted.'); fetchEvents(); }
            else toast.error(res.message);
        } catch (e) { toast.error('Server error.'); }
        finally { setLoadingActionIds(p => ({...p, [`del_${id}`]: false})); }
    };

    const handleExportPDF = async (event: any) => {
        setIsExportingMap(p => ({...p, [event.id]: true}));
        try {
            const toastId = toast.loading('Fetching applicants...');
            let applicants: any[] = [];
            if (event.is_paid) {
                const res = await api.eventRedirects.get({ event_id: event.id });
                if (res.success && Array.isArray(res.data)) applicants = res.data;
            } else {
                const res = await api.eventRegistrations.get({ event_id: event.id });
                if (res.success && Array.isArray(res.data)) applicants = res.data;
            }
            toast.dismiss(toastId);
            exportEventApplicantsPDF(event, applicants);
        } catch (e) {
            toast.error('Failed to fetch applicants for PDF');
        } finally { setIsExportingMap(p => ({...p, [event.id]: false})); }
    };

    const toggle = (id: string) => setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Team Events</h1>
                    <p className="text-muted-foreground mt-1">Manage your team's events</p>
                </div>
                <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) { setForm(emptyForm()); setEditingId(null); } }}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
                            <Plus className="h-4 w-4 mr-2" />New Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                            <DialogDescription>Fill in all required fields.</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[65vh] pr-2">
                            <div className="grid gap-4 py-4">
                                {[
                                    { label: 'Title *', field: 'title', placeholder: 'Event title' },
                                    { label: 'Location *', field: 'location', placeholder: 'Venue / room / city' },
                                ].map(({ label, field, placeholder }) => (
                                    <div key={field} className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right text-sm">{label}</Label>
                                        <Input className="col-span-3" placeholder={placeholder} value={(form as any)[field]}
                                            onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
                                    </div>
                                ))}
                                {/* Category */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-sm">Category *</Label>
                                    <div className="col-span-3">
                                        <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as any }))}>
                                            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                            <SelectContent>
                                                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {/* Proof document (PDF) — always required */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-sm">Proof (PDF) *</Label>
                                    <div className="col-span-3 flex items-center gap-3">
                                        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border-0 cursor-pointer text-sm font-medium transition-colors bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80">
                                            Choose a file
                                            <input type="file" accept=".pdf" className="hidden"
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            const base64String = (reader.result as string).split(',')[1];
                                                            setForm(p => ({ ...p, proofOfAccess: file.name, proofOfAccessBase64: base64String || '' }));
                                                        };
                                                        reader.readAsDataURL(file);
                                                    } else {
                                                        setForm(p => ({ ...p, proofOfAccess: '', proofOfAccessBase64: '' }));
                                                    }
                                                }}
                                            />
                                        </label>
                                        {form.proofOfAccess && (
                                            <span className="text-xs text-muted-foreground">
                                                Attached: <span className="font-medium">{form.proofOfAccess}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {(() => {
                                    const selectedCat = categories.find(c => c.id === form.category);
                                    if (selectedCat?.uni_exclusive) {
                                        return (
                                            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-4 rounded-lg space-y-4 mb-2">
                                                <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                                                    <Mic className="h-3.5 w-3.5 inline mr-1 mb-0.5" />
                                                    This exclusive category requires additional verified details.
                                                </p>

                                                {/* Reviewers */}
                                                <div className="grid grid-cols-4 items-start gap-4">
                                                    <Label className="text-right text-sm mt-2">Reviewers</Label>
                                                    <div className="col-span-3 space-y-2">
                                                        <div className="flex gap-2">
                                                            <Input placeholder="Reviewer name" value={newReviewer} onChange={e => setNewReviewer(e.target.value)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        if (newReviewer.trim()) {
                                                                            setForm(p => ({ ...p, reviewers: [...p.reviewers, newReviewer.trim()] }));
                                                                            setNewReviewer('');
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <Button type="button" size="sm" variant="secondary" onClick={() => {
                                                                if (newReviewer.trim()) {
                                                                    setForm(p => ({ ...p, reviewers: [...p.reviewers, newReviewer.trim()] }));
                                                                    setNewReviewer('');
                                                                }
                                                            }}>Add</Button>
                                                        </div>
                                                        {form.reviewers.length > 0 && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {form.reviewers.map((r, i) => (
                                                                    <Badge key={i} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                                                                        {r}
                                                                        <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setForm(p => ({ ...p, reviewers: p.reviewers.filter((_, idx) => idx !== i) }))}>
                                                                            &times;
                                                                        </button>
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Organizers */}
                                                <div className="grid grid-cols-4 items-start gap-4">
                                                    <Label className="text-right text-sm mt-2">Organizers</Label>
                                                    <div className="col-span-3 space-y-2">
                                                        <div className="flex gap-2">
                                                            <Input placeholder="Organizer name" value={newOrganizer} onChange={e => setNewOrganizer(e.target.value)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        if (newOrganizer.trim()) {
                                                                            setForm(p => ({ ...p, organizers: [...p.organizers, newOrganizer.trim()] }));
                                                                            setNewOrganizer('');
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <Button type="button" size="sm" variant="secondary" onClick={() => {
                                                                if (newOrganizer.trim()) {
                                                                    setForm(p => ({ ...p, organizers: [...p.organizers, newOrganizer.trim()] }));
                                                                    setNewOrganizer('');
                                                                }
                                                            }}>Add</Button>
                                                        </div>
                                                        {form.organizers.length > 0 && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {form.organizers.map((o, i) => (
                                                                    <Badge key={i} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                                                                        {o}
                                                                        <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setForm(p => ({ ...p, organizers: p.organizers.filter((_, idx) => idx !== i) }))}>
                                                                            &times;
                                                                        </button>
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Laboratory */}
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label className="text-right text-sm">Laboratory</Label>
                                                    <Input className="col-span-3" placeholder="Managing laboratory" value={(form as any).laboratory}
                                                        onChange={e => setForm(p => ({ ...p, laboratory: e.target.value }))} />
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label className="text-right text-sm mt-2">Description</Label>
                                    <textarea className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-[var(--input-background)] px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="Event description" value={form.description}
                                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-sm">Start Date *</Label>
                                    <Input className="col-span-2" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                                    <Input className="col-span-1" type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-sm">End Date *</Label>
                                    <Input className="col-span-2" type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                                    <Input className="col-span-1" type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-sm">Max Seats</Label>
                                    <Input className="col-span-3" type="number" min={0} placeholder="Leave 0 for unlimited" value={form.maxSeats || ''} onChange={e => setForm(p => ({ ...p, maxSeats: Number(e.target.value) }))} />
                                </div>
                                <Separator />
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-sm">Paid Event</Label>
                                    <div className="col-span-3 flex items-center gap-3">
                                        <Switch checked={form.isPaid} onCheckedChange={v => setForm(p => ({ ...p, isPaid: v }))} />
                                        <span className="text-sm text-muted-foreground">{form.isPaid ? 'Paid registration' : 'Free registration'}</span>
                                    </div>
                                </div>
                                {form.isPaid && (
                                    <>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right text-sm">Price (DZD)</Label>
                                            <Input className="col-span-3" type="number" value={form.price}
                                                onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right text-sm">Payment URL</Label>
                                            <Input className="col-span-3" placeholder="https://..." value={form.joinUrl}
                                                onChange={e => setForm(p => ({ ...p, joinUrl: e.target.value }))} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button disabled={isSaving} onClick={handleSave} className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {editingId ? 'Save Changes' : 'Create Event'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="bg-muted p-1 rounded-lg inline-flex">
                    {(['upcoming', 'completed'] as const).map(f => (
                        <Button key={f} variant={filter === f ? 'default' : 'ghost'} size="sm"
                            className={`text-xs ${filter !== f ? 'hover:bg-transparent' : ''}`} onClick={() => setFilter(f)}>
                            {f === 'upcoming' ? 'Active' : 'Past'} Events
                        </Button>
                    ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    {([{ field: 'date', label: 'Date' }, { field: 'title', label: 'Name' }, { field: 'attendees', label: 'Attendees' }] as const).map(({ field, label }) => (
                        <button
                            key={field}
                            onClick={() => {
                                if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                else { setSortField(field); setSortDir('asc'); }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${sortField === field ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'hover:bg-muted'
                                }`}
                        >
                            {label}
                            {sortField === field && (sortDir === 'asc' ? <ArrowUp className="inline h-3 w-3 ml-0.5" /> : <ArrowDown className="inline h-3 w-3 ml-0.5" />)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {filtered.map(event => {
                    const isExp = expanded.has(event.id);
                    return (
                        <Card key={event.id} className="border-0 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <CardTitle className="text-lg font-medium">{event.title}</CardTitle>
                                            <EventBadge status={(() => {
                                                const ed = event.end_date && event.end_date.length > 10 ? event.end_date.substring(0, 10) : event.end_date;
                                                const sd = event.start_date && event.start_date.length > 10 ? event.start_date.substring(0, 10) : event.start_date;
                                                const now = new Date();
                                                if (now < new Date(sd + 'T00:00:00')) return 'upcoming';
                                                if (now > new Date(ed + 'T23:59:59')) return 'completed';
                                                return 'active';
                                            })()} />
                                            <Badge variant="secondary" className="text-xs">{event.category}</Badge>
                                            {event.is_paid && <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50">Paid · {event.price} DZD</Badge>}
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1"><Mic className="h-3.5 w-3.5" />{event.creator_name || '—'}</span>
                                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location}</span>
                                            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(event.start_date)}{event.start_time ? ` ${event.start_time}` : ''} → {formatDate(event.end_date)}{event.end_time ? ` ${event.end_time}` : ''}</span>
                                            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{event.registration_count || 0} registrations</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button variant="outline" size="sm" onClick={() => toggle(event.id)}>{isExp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button>
                                        <Button variant="outline" size="sm" onClick={() => setSelectedEvent(event)}><Eye className="h-4 w-4" /></Button>
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(event)}>Edit</Button>
                                        <Button disabled={loadingActionIds[`del_${event.id}`]} variant="ghost" size="icon" className="text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(event.id)}>
                                            {loadingActionIds[`del_${event.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                        <Button disabled={isExportingMap[event.id]} size="sm" variant="secondary" onClick={() => handleExportPDF(event)} className="gap-1">
                                            {isExportingMap[event.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}PDF
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            {isExp && (
                                <CardContent className="pt-0">
                                    <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">{event.description || 'No description.'}</div>
                                    {event.is_paid && event.join_url && (
                                        <div className="mt-3 flex items-center gap-2 text-sm">
                                            <Link className="h-4 w-4 text-muted-foreground" />
                                            <a href={event.join_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{event.join_url}</a>
                                        </div>
                                    )}
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
                {filtered.length === 0 && (
                    <Card className="border-0 shadow-sm">
                        <CardContent className="flex items-center justify-center p-12">
                            <div className="text-center space-y-2">
                                <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                                <p className="text-muted-foreground font-medium">No {filter} events</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={selectedEvent !== null} onOpenChange={() => setSelectedEvent(null)}>
                <DialogContent className="sm:max-w-[620px] max-h-[80vh]">
                    {selectedEvent && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-3"><DialogTitle className="text-xl">{selectedEvent.title}</DialogTitle><EventBadge status={(() => {
                                    const ed = selectedEvent.end_date && selectedEvent.end_date.length > 10 ? selectedEvent.end_date.substring(0, 10) : selectedEvent.end_date;
                                    const sd = selectedEvent.start_date && selectedEvent.start_date.length > 10 ? selectedEvent.start_date.substring(0, 10) : selectedEvent.start_date;
                                    const now = new Date();
                                    if (now < new Date(sd + 'T00:00:00')) return 'upcoming';
                                    if (now > new Date(ed + 'T23:59:59')) return 'completed';
                                    return 'active';
                                })()} /></div>
                                <DialogDescription>Event details</DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[55vh] pr-4">
                                <div className="space-y-4 text-sm">
                                    <p className="text-muted-foreground">{selectedEvent.description}</p>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: 'Creator', value: selectedEvent.creator_name || '—' },
                                            { label: 'Location', value: selectedEvent.location },
                                            { label: 'Start', value: `${formatDate(selectedEvent.start_date)}${selectedEvent.start_time ? ' at ' + selectedEvent.start_time : ''}` },
                                            { label: 'End', value: `${formatDate(selectedEvent.end_date)}${selectedEvent.end_time ? ' at ' + selectedEvent.end_time : ''}` },
                                            { label: 'Registrations', value: (selectedEvent.registration_count || 0).toString() },
                                            { label: 'Category', value: selectedEvent.category_name || '—' },
                                            { label: 'Type', value: selectedEvent.is_paid ? `Paid – ${selectedEvent.price} DZD` : 'Free' },
                                        ].map(({ label, value }) => (
                                            <div key={label}><p className="text-xs text-muted-foreground mb-1">{label}</p><p className="font-medium">{value}</p></div>
                                        ))}
                                    </div>
                                </div>
                            </ScrollArea>
                            <DialogFooter>
                                <Button disabled={isExportingMap[selectedEvent.id]} size="sm" variant="secondary" onClick={() => handleExportPDF(selectedEvent)} className="gap-1 mr-auto">
                                    {isExportingMap[selectedEvent.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}Export PDF
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedEvent(null)}>Close</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
