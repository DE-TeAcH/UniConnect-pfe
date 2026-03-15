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
  Link, FileDown, ShieldCheck, FolderOpen, Pencil, Check, X, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { api } from '../services/api';
import { exportEventApplicantsPDF } from '../utils/pdfExport';
import { toast } from 'sonner';

const emptyForm = () => ({ title: '', description: '', location: '', startDate: '', startTime: '', endDate: '', endTime: '', maxSeats: 0, isPaid: false, price: 0, joinUrl: '', team: '', category: '', proofOfAccess: '' });

function EventBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    upcoming: 'text-orange-600 border-orange-200 bg-orange-50',
    active: 'text-green-600 border-green-200 bg-green-50',
    completed: 'text-blue-600 border-blue-200 bg-blue-50',
    pending: 'text-yellow-600 border-yellow-200 bg-yellow-50',
  };
  return <Badge variant="outline" className={map[status] || 'text-gray-600 border-gray-200 bg-gray-50'}>{status}</Badge>;
}

export interface EventCategory {
  id: string;
  name: string;
  uni_exclusive: boolean;
}

export function AdminEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.events.get();
      if (res.success && Array.isArray(res.data)) setEvents(res.data);
    } catch (e) { console.error('Failed to fetch events', e); }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.eventCategories.get();
      if (res.success && Array.isArray(res.data)) setCategories(res.data);
    } catch (e) { console.error('Failed to fetch categories', e); }
  };

  // Categories (managed list)
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatExclusive, setNewCatExclusive] = useState(false);
  const [editingCat, setEditingCat] = useState<{ id: string; val: string; exclusive: boolean } | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [creatorFilter, setCreatorFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [sortField, setSortField] = useState<'date' | 'title' | 'attendees'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Category CRUD helpers
  const addCategory = async () => {
    const name = newCatName.trim();
    if (!name || categories.some(c => c.name === name)) return;
    try {
      const res = await api.eventCategories.create({ name, uni_exclusive: newCatExclusive });
      if (res.success) {
        toast.success('Category added');
        fetchCategories();
        setNewCatName('');
        setNewCatExclusive(false);
      } else toast.error(res.message);
    } catch (e) { toast.error('Server error'); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      const res = await api.eventCategories.delete(id);
      if (res.success) {
        toast.success('Category deleted');
        fetchCategories();
      } else toast.error(res.message);
    } catch (e) { toast.error('Server error'); }
  };

  const saveEditCat = async () => {
    if (!editingCat) return;
    const name = editingCat.val.trim();
    if (!name) return;
    try {
      const res = await api.eventCategories.update({ id: editingCat.id, name, uni_exclusive: editingCat.exclusive });
      if (res.success) {
        toast.success('Category updated');
        fetchCategories();
        setEditingCat(null);
      } else toast.error(res.message);
    } catch (e) { toast.error('Server error'); }
  };

  const formatDate = (d: string) => {
    const dateOnly = d && d.length > 10 ? d.substring(0, 10) : d;
    return new Date(dateOnly + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const isUpcoming = (e: any) => {
    const sd = e.start_date && e.start_date.length > 10 ? e.start_date.substring(0, 10) : e.start_date;
    return new Date(sd + 'T00:00:00') > new Date();
  };

  const filtered = events
    .filter(e => {
      if (statusFilter === 'upcoming' && !isUpcoming(e)) return false;
      if (statusFilter === 'completed' && isUpcoming(e)) return false;
      if (categoryFilter !== 'all' && e.category_id !== categoryFilter) return false;
      if (creatorFilter !== 'all' && e.creator_role !== creatorFilter) return false;
      if (typeFilter === 'paid' && !e.is_paid) return false;
      if (typeFilter === 'free' && e.is_paid) return false;
      return true;
    })
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
    try {
      const payload = {
        title: form.title,
        description: form.description,
        location: form.location,
        start_date: form.startDate,
        start_time: form.startTime,
        end_date: form.endDate,
        end_time: form.endTime,
        max_seats: form.maxSeats || null,
        is_paid: form.isPaid,
        price: form.isPaid ? form.price : null,
        join_url: form.joinUrl,
        category_id: form.category,
      };
      if (editingId !== null) {
        await api.events.update({ id: editingId, ...payload });
        toast.success('Event updated.');
      }
      await fetchEvents();
    } catch (e) { toast.error('Failed to save event.'); }
    setIsOpen(false);
    setForm(emptyForm());
    setEditingId(null);
  };

  const handleEdit = (e: any) => {
    setForm({ title: e.title, description: e.description || '', location: e.location, startDate: e.start_date, startTime: e.start_time || '', endDate: e.end_date, endTime: e.end_time || '', maxSeats: e.max_seats || 0, isPaid: e.is_paid, price: e.price || 0, joinUrl: e.join_url || '', team: e.team_name || '', category: e.category_id || '', proofOfAccess: e.proof_pdf || '' });
    setEditingId(e.id); setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await api.events.delete(id);
      await fetchEvents();
      toast.success('Event deleted.');
    } catch (e) { toast.error('Failed to delete event.'); }
  };

  const toggle = (id: string) => setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const roleColor: Record<string, string> = {
    admin: 'text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    'team_leader': 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    'team-leader': 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    teacher: 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    company: 'text-red-600 border-red-200 bg-red-50 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  };
  const getCreatorDisplay = (event: any): string => {
    return event.creator_name || event.creator_role || '—';
  };

  const formatCreatedAt = (iso?: string) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const toggleSort = (field: 'date' | 'title' | 'attendees') => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Events</h1>
          <p className="text-muted-foreground mt-1">Manage all platform events</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Manage Categories */}
          <Button variant="outline" onClick={() => setCatDialogOpen(true)}>
            <FolderOpen className="h-4 w-4 mr-2" />Manage Categories
          </Button>
          <Dialog open={isOpen} onOpenChange={o => { setIsOpen(o); if (!o) { setForm(emptyForm()); setEditingId(null); } }}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogDescription>Fill in all required fields to edit the event.</DialogDescription>
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
                      <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Proof document (PDF) — read-only for admin */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-sm">Proof (PDF)</Label>
                    <div className="col-span-3 flex items-center gap-2">
                      {form.proofOfAccess ? (
                        <a href="#" onClick={e => { e.preventDefault(); toast.info(`Previewing: ${form.proofOfAccess}`); }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80">
                          <Eye className="h-4 w-4" />Preview PDF
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No document attached</span>
                      )}
                      {form.proofOfAccess && (
                        <span className="text-xs text-muted-foreground">{form.proofOfAccess}</span>
                      )}
                    </div>
                  </div>
                  {/* Team */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-sm">Team</Label>
                    <Input className="col-span-3" placeholder="Organizing team" value={(form as any).team}
                      onChange={e => setForm(p => ({ ...p, team: e.target.value }))} />
                  </div>
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
                <Button onClick={handleSave} className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Manage Categories Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>Add, rename, or remove event categories.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {/* Add new */}
            <div className="flex gap-2 items-center">
              <Input
                placeholder="New category name..."
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
                className="flex-1"
              />
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <Switch checked={newCatExclusive} onCheckedChange={setNewCatExclusive} />
                <span className="text-xs text-muted-foreground mr-1">Exclusive</span>
              </div>
              <Button size="sm" onClick={addCategory} disabled={!newCatName.trim()}>
                <Plus className="h-4 w-4 mr-1" />Add
              </Button>
            </div>
            <Separator />
            {/* List */}
            <ScrollArea className="max-h-[280px] pr-1">
              <div className="space-y-1">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 group">
                    {editingCat?.id === cat.id ? (
                      <>
                        <Input
                          className="flex-1 h-7 text-sm"
                          value={editingCat.val}
                          onChange={e => setEditingCat(p => p ? { ...p, val: e.target.value } : null)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEditCat(); if (e.key === 'Escape') setEditingCat(null); }}
                          autoFocus
                        />
                        <div className="flex items-center gap-1 bg-background px-1.5 py-1 rounded border">
                          <Switch className="scale-75" checked={editingCat.exclusive} onCheckedChange={v => setEditingCat(p => p ? { ...p, exclusive: v } : null)} />
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={saveEditCat}><Check className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setEditingCat(null)}><X className="h-4 w-4" /></Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium flex items-center gap-2">
                          {cat.name}
                          {!!cat.uni_exclusive && <Badge variant="outline" className="text-[10px] h-4 cursor-default px-1 font-normal bg-orange-50 text-orange-700 border-orange-200">Exclusive</Badge>}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors" onClick={() => setEditingCat({ id: cat.id, val: cat.name, exclusive: cat.uni_exclusive })}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors" onClick={() => deleteCategory(cat.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
                {categories.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No categories yet.</p>}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters & Sort */}
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
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Creator Filter */}
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

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowUpDown className="h-3.5 w-3.5" />
          {([{ field: 'date', label: 'Date' }, { field: 'title', label: 'Name' }, { field: 'attendees', label: 'Attendees' }] as const).map(({ field, label }) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${sortField === field ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'hover:bg-muted'
                }`}
            >
              {label}
              {sortField === field && (sortDir === 'asc' ? <ArrowUp className="inline h-3 w-3 ml-0.5" /> : <ArrowDown className="inline h-3 w-3 ml-0.5" />)}
            </button>
          ))}
        </div>
      </div>

      {/* Event list */}
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
                      <EventBadge status={isUpcoming(event) ? 'upcoming' : 'completed'} />
                      <Badge variant="secondary" className="text-xs">{event.category_name}</Badge>
                      {event.is_paid && <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">Paid · {event.price} DZD</Badge>}
                      {event.creator_role && (
                        <Badge variant="outline" className={`text-xs capitalize ${roleColor[event.creator_role.toLowerCase()] || ''}`}>
                          <ShieldCheck className="h-3 w-3 mr-1" />{event.creator_role}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Mic className="h-3.5 w-3.5" />{event.creator_name || '—'}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(event.start_date)}{event.start_time ? ` ${event.start_time}` : ''} → {formatDate(event.end_date)}{event.end_time ? ` ${event.end_time}` : ''}</span>
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{event.registration_count || 0} attendees</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Created by <span className="font-medium text-foreground">{getCreatorDisplay(event)}</span>{event.created_at ? <span> · {formatCreatedAt(event.created_at)}</span> : null}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => toggle(event.id)}>{isExp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedEvent(event)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(event)}>Edit</Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(event.id)}><Trash2 className="h-4 w-4" /></Button>
                    <Button size="sm" variant="secondary" onClick={() => exportEventApplicantsPDF(event)} className="gap-1"><FileDown className="h-4 w-4" />PDF</Button>
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
                <p className="text-muted-foreground font-medium">No events found</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={selectedEvent !== null} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[620px] max-h-[80vh]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 flex-wrap"><DialogTitle className="text-xl">{selectedEvent.title}</DialogTitle><EventBadge status={isUpcoming(selectedEvent) ? 'upcoming' : 'completed'} /></div>
                <DialogDescription>Full event details</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[55vh] pr-4">
                <div className="space-y-4 text-sm">
                  <p className="text-muted-foreground">{selectedEvent.description || 'No description.'}</p>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Creator', value: selectedEvent.creator_name || '—' },
                      { label: 'Location', value: selectedEvent.location },
                      { label: 'Start', value: `${formatDate(selectedEvent.start_date)}${selectedEvent.start_time ? ' at ' + selectedEvent.start_time : ''}` },
                      { label: 'End', value: `${formatDate(selectedEvent.end_date)}${selectedEvent.end_time ? ' at ' + selectedEvent.end_time : ''}` },
                      { label: 'Registrations', value: (selectedEvent.registration_count || 0).toString() },
                      { label: 'Category', value: selectedEvent.category_name },
                      { label: 'Type', value: selectedEvent.is_paid ? `Paid – ${selectedEvent.price} DZD` : 'Free' },
                      { label: 'Created By', value: getCreatorDisplay(selectedEvent) },
                      { label: 'Created At', value: formatCreatedAt(selectedEvent.created_at) || '—' },
                      { label: 'Team', value: selectedEvent.team_name || '—' },
                    ].map(({ label, value }) => (
                      <div key={label}><p className="text-xs text-muted-foreground mb-1">{label}</p><p className="font-medium">{value}</p></div>
                    ))}

                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button size="sm" variant="secondary" onClick={() => exportEventApplicantsPDF(selectedEvent)} className="gap-1 mr-auto"><FileDown className="h-4 w-4" />Export PDF</Button>
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
