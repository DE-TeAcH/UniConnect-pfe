// AdminCreators.tsx
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Users,
  Building,
  Calendar,
  Mail,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  User,
  Briefcase,
  MapPin,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../services/api';
import { formatDisplayDate } from '../utils/dates';
import { toast } from 'sonner';
import { ConfirmationDialog } from './ui/ConfirmationDialog';

interface TeamMember {
  id: number;
  name: string;
  role: 'leader' | 'dept-head' | 'member';
  department: string;
  email: string;
  joinDate: string;
}

interface Team {
  id: number;
  name: string;
  leader: string;
  email: string;
  totalMembers: number;
  joinDate: string;
  events: number;
  category: string;
  description: string;
  members: TeamMember[];
}

type SortField = 'name' | 'leader' | 'category' | 'joinDate' | 'events';
type SortDirection = 'asc' | 'desc';

export function AdminCreators() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    team: any | null;
    isTeacher: boolean;
    isPromotion?: boolean;
  }>({
    isOpen: false,
    team: null,
    isTeacher: false,
    isPromotion: false,
  });

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const response = await api.users.get();
      if (response.success && Array.isArray(response.data)) {
        const creatorsData = response.data.filter((u: any) =>
          ['teacher', 'company', 'team_leader', 'team-leader'].includes(u.role) && u.manage === 1
        );

        const uniqueCreatorsMap = new Map();
        creatorsData.forEach((u: any) => {
          // If teacher, group by user ID. If company/team-leader, group by team_id
          const teamKey = u.role === 'teacher' ? `user-${u.id}` : (u.team_id || `user-${u.id}`);
          if (!uniqueCreatorsMap.has(teamKey)) {
            uniqueCreatorsMap.set(teamKey, u);
          }
        });

        const mappedTeams = Array.from(uniqueCreatorsMap.values()).map((u: any) => ({
          id: u.role === 'teacher' ? u.id : (u.team_id || u.id),
          isTeacher: u.role === 'teacher',
          name: u.role === 'teacher' ? u.full_name : (u.team_name || u.full_name),
          leader: u.full_name || 'No Leader',
          representativeId: u.id, // The user ID is the rep ID for clubs/companies
          email: u.email || 'N/A',
          totalMembers: 1,
          joinDate: formatDisplayDate(u.join_date || u.created_at),
          events: parseInt(u.event_count) || 0,
          category: u.role,
          description: '',
          location: u.location || u.faculty || '',
          members: []
        }));
        setTeams(mappedTeams);
      }
    } catch (error) {
      console.error('Failed to fetch teams', error);
    } finally {
      setIsLoading(false);
    }
  };

  const [creatorRequests, setCreatorRequests] = useState<any[]>([]);
  const [requestExistence, setRequestExistence] = useState<Record<number, any>>({});

  const fetchRequests = async () => {
    try {
      const res = await api.creatorRequests.get();
      if (res.success && Array.isArray(res.data)) {
        const mappedRequests = res.data.map(req => ({
          ...req,
          name: req.entity_name || 'Unknown Entity',
          leader: req.representative_name || 'Unknown Representative',
          email: req.contact_email,
          username: req.requested_username,
          date: req.created_at ? new Date(req.created_at).toLocaleDateString() : new Date().toLocaleDateString()
        }));
        setCreatorRequests(mappedRequests);

        // Check existence for each request
        const existenceMap: Record<number, any> = {};
        for (const req of mappedRequests) {
          const userRes = await api.users.get({ email: req.email });
          if (userRes.success && Array.isArray(userRes.data) && userRes.data.length > 0) {
            existenceMap[req.id] = userRes.data[0];
          } else if (req.username) {
            const userRes2 = await api.users.get({ username: req.username });
            if (userRes2.success && Array.isArray(userRes2.data) && userRes2.data.length > 0) {
              existenceMap[req.id] = userRes2.data[0];
            }
          }
        }
        setRequestExistence(existenceMap);
      }
    } catch (e) {
      console.error('Failed to fetch requests', e);
    }
  };

  React.useEffect(() => {
    fetchTeams();
    fetchRequests();
  }, []);

  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null);

  const handlePromoteUser = async (req: any, existingUser: any) => {
    setIsLoading(true);
    try {
      // 1. Update user to be a creator
      const updateRes = await api.users.update(String(existingUser.id), {
        manage: true,
        role: req.role || 'teacher',
        affiliation: req.role === 'teacher' ? (req.entity_name || req.name) : existingUser.affiliation
      });

      if (!updateRes.success) {
        toast.error(updateRes.message || 'Failed to promote user');
        return;
      }

      // 2. If company, create team profile
      if (req.role === 'company') {
        const teamPayload = {
          representative_id: existingUser.id,
          name: req.entity_name || req.name,
          description: req.description || '',
          location: req.location || 'University'
        };
        const teamResponse = await api.teams.create(teamPayload);
        if (!teamResponse.success) {
          toast.error(teamResponse.message || 'Failed to create team profile');
          return;
        }
      }

      // 3. Cleanup request
      await api.creatorRequests.update({ id: String(req.id), action: 'approve' });
      setCreatorRequests(prev => prev.filter(r => r.id !== req.id));

      fetchTeams();
      toast.success(`${existingUser.full_name || existingUser.name} has been promoted to creator!`);
    } catch (e) {
      console.error('Promotion error:', e);
      toast.error('An error occurred during promotion');
    } finally {
      setIsLoading(false);
      setConfirmDialog({ isOpen: false, team: null, isTeacher: false });
    }
  };

  const handleAcceptRequest = async (req: any) => {
    const existingUser = requestExistence[req.id];

    if (existingUser) {
      setConfirmDialog({
        isOpen: true,
        team: {
          ...req,
          existingUser
        },
        isTeacher: req.role === 'teacher',
        isPromotion: true,
      });
    } else {
      setNewTeam({
        name: req.entity_name || req.name || '',
        role: req.role || 'teacher',
        leader: req.representative_name || req.leader || '',
        email: req.email,
        username: req.username || '',
        password: req.requested_password || '', // Pre-fill password!
        description: req.description || '',
        bacMatricule: '',
        bacYear: '',
        location: req.location || ''
      });
      setIsRequestsModalOpen(false);
      setIsAddDialogOpen(true);
    }
  };

  const handleDenyRequest = async (id: string | number) => {
    try {
      const res = await api.creatorRequests.update({ id: String(id), action: 'deny' });
      if (res.success) {
        setCreatorRequests(prev => prev.filter(r => r.id !== id));
        toast.success('Request denied.');
      }
    } catch (e) {
      toast.error('Failed to deny request');
    }
  };

  // NEW: include bac fields for leader when creating a team
  const [newTeam, setNewTeam] = useState({
    name: '',
    role: 'team-leader',
    leader: '',
    email: '',
    username: '',
    password: '',
    // category removed
    description: '',
    // creationDate removed
    bacMatricule: '',
    bacYear: '',
    location: ''
  });

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle string comparisons
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [teams, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const handleSelectTeam = (teamId: number) => {
    setSelectedTeams(prev =>
      prev.includes(teamId)
        ? prev.filter((id: number) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSelectAll = () => {
    setSelectedTeams(
      selectedTeams.length === teams.length ? [] : teams.map((team: Team) => team.id)
    );
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTeams.length} teams? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.teams.delete(selectedTeams.map(String));
      if (response.success) {
        setTeams((prev: any[]) => prev.filter((team: Team) => !selectedTeams.includes(team.id)));
        setSelectedTeams([]);
      } else {
        toast.error(response.message || 'Failed to delete teams');
      }
    } catch (error) {
      console.error('Error deleting teams:', error);
      toast.error('Failed to delete teams');
    }
  };

  const handleDeleteTeam = (team: any) => {
    setConfirmDialog({
      isOpen: true,
      team,
      isTeacher: team.category === 'teacher',
    });
  };

  const executeDeletion = async () => {
    const { team, isTeacher } = confirmDialog;
    if (!team) return;

    setIsLoading(true);
    try {
      // 1. Fetch and cleanup events first
      const creatorId = team.representativeId || team.id;
      const evRes = await api.events.get({ creator_id: String(creatorId) });
      if (evRes.success && Array.isArray(evRes.data)) {
        for (const event of evRes.data) {
          await api.events.delete(String(event.id));
        }
      }

      // 2. Perform demotion or deletion
      let response;
      if (isTeacher) {
        response = await api.users.update(String(team.id), { manage: false });
      } else {
        response = await api.teams.delete(String(team.id));
        if (response.success && team.representativeId) {
          await api.users.delete(String(team.representativeId));
        }
      }

      if (response.success) {
        setTeams(prev => prev.filter((t: any) => t.id !== team.id));
        setSelectedTeams(prev => prev.filter((id: number) => id !== team.id));
        toast.success(isTeacher ? 'Teacher access removed and events cleaned up' : 'Team, representative, and events deleted');
      } else {
        toast.error(response.message || 'Failed to perform deletion');
      }
    } catch (error) {
      console.error('Error in deletion:', error);
      toast.error('An error occurred during deletion');
    } finally {
      setIsLoading(false);
      setConfirmDialog(prev => ({ ...prev, isOpen: false, team: null }));
    }
  };

  // UPDATED: handleAddTeam includes bac validation + fields
  const handleAddTeam = async () => {
    if (!newTeam.name || !newTeam.leader || !newTeam.email || !newTeam.username || !newTeam.password) {
      toast.error('Please fill the required fields.');
      return;
    }

    // validate matricule if provided
    const matricule = newTeam.bacMatricule?.trim();
    if (matricule && !/^\d{8}$/.test(matricule)) {
      toast.error('Bac matricule must be exactly 8 digits.');
      return;
    }

    // validate year if provided (reasonable range)
    const yearStr = newTeam.bacYear?.trim();
    if (yearStr) {
      if (!/^\d{4}$/.test(yearStr)) {
        toast.error('Bac year must be a 4-digit year (e.g. 2018).');
        return;
      }
      const yearNum = Number(yearStr);
      const currentYear = new Date().getFullYear();
      if (yearNum < 1900 || yearNum > currentYear + 1) {
        toast.error(`Bac year must be between 1900 and ${currentYear + 1}.`);
        return;
      }
    }

    setIsLoading(true);
    try {
      // 1. Check if user already exists (by email or username)
      let existingUser = null;
      const emailCheck = await api.users.get({ email: newTeam.email });
      if (emailCheck.success && Array.isArray(emailCheck.data) && emailCheck.data.length > 0) {
        existingUser = emailCheck.data[0];
      } else {
        const userCheck = await api.users.get({ username: newTeam.username });
        if (userCheck.success && Array.isArray(userCheck.data) && userCheck.data.length > 0) {
          existingUser = userCheck.data[0];
        }
      }

      let userId = existingUser?.id;
      let teamId = existingUser?.team_id || null;

      if (existingUser) {
        // Update existing user to be a creator
        const updateRes = await api.users.update(String(userId), {
          manage: true,
          role: newTeam.role,
          affiliation: newTeam.role === 'teacher' ? newTeam.name : (existingUser.affiliation || null)
        });
        if (!updateRes.success) {
          toast.error(updateRes.message || 'Failed to update existing user account');
          setIsLoading(false);
          return;
        }
        toast.info(`Updated existing user account for ${newTeam.leader}`);
      } else {
        // Create User First (New)
        if (!newTeam.password) {
          toast.error('Password is required for new creators.');
          setIsLoading(false);
          return;
        }

        // Generate Team ID if needed
        if (newTeam.role !== 'teacher') {
          teamId = uuidv4();
        }

        const userPayload = {
          role: newTeam.role,
          name: newTeam.leader,
          email: newTeam.email,
          username: newTeam.username,
          password: newTeam.password,
          bac_matricule: newTeam.role === 'team-leader' ? (newTeam.bacMatricule || null) : null,
          bac_year: newTeam.role === 'team-leader' ? (Number(newTeam.bacYear) || null) : null,
          affiliation: newTeam.role === 'teacher' ? newTeam.name : null,
          team_id: teamId, // Assign team ID before creation!
          manage: true
        };

        const userResponse = await api.users.create(userPayload);
        if (!userResponse.success) {
          toast.error(userResponse.message || 'Failed to create user account');
          setIsLoading(false);
          return;
        }
        userId = (userResponse.data as any).id;
      }

      // 2. Create Team Profile (if not teacher)
      if (newTeam.role !== 'teacher') {
        const teamPayload = {
          id: teamId || uuidv4(), // Use existing/generated ID
          representative_id: userId,
          name: newTeam.name,
          description: newTeam.description || '',
          location: newTeam.location || 'University'
        };

        const teamResponse = await api.teams.create(teamPayload);
        if (!teamResponse.success) {
          // If we created a NEW user, roll back
          if (!existingUser) await api.users.delete(userId);
          toast.error(teamResponse.message || 'Failed to create team profile');
          setIsLoading(false);
          return;
        }
      }

      // 3. Delete any associated creator request if it exists
      const matchingReq = creatorRequests.find(r => r.email === newTeam.email || r.username === newTeam.username);
      if (matchingReq) {
        await api.creatorRequests.update({ id: String(matchingReq.id), action: 'approve' });
        setCreatorRequests(prev => prev.filter(r => r.id !== matchingReq.id));
      }

      // Success cleanup
      fetchTeams(); // Refresh list
      setNewTeam({
        name: '',
        role: 'team-leader',
        leader: '',
        email: '',
        username: '',
        password: '',
        description: '',
        bacMatricule: '',
        bacYear: '',
        location: ''
      });
      setIsAddDialogOpen(false);
      toast.success(newTeam.role === 'teacher' ? 'Teacher account activated successfully' : 'Creator account and profile created successfully');
    } catch (error) {
      console.error('Creator creation error:', error);
      toast.error('An error occurred while creating the creator');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'leader':
      case 'team-leader':
        return 'text-purple-700 border-purple-300 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
      case 'dept-head':
        return 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'member':
        return 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      default:
        return 'text-gray-600 border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Creators Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage all registered creators (Teachers, Companies, Team Leaders) and their activities
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={fetchTeams} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {selectedTeams.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Selected ({selectedTeams.length})</span>
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsRequestsModalOpen(true)} className="flex items-center space-x-2 relative">
            <Mail className="h-4 w-4" />
            <span>Manage Requests</span>
            {creatorRequests.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {creatorRequests.length}
              </span>
            )}
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2 bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">
                <Plus className="h-4 w-4" />
                <span>Add New Creator</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Team</DialogTitle>
                <DialogDescription>
                  Create a new team and assign a team leader with login credentials
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Role Selection */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">Role</Label>
                  <Select value={newTeam.role} onValueChange={(value: string) => setNewTeam(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team-leader">Team Leader</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Entity Name */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="team-name" className="text-right">
                    {newTeam.role === 'teacher' ? 'Faculty Name' :
                      newTeam.role === 'company' ? 'Company Name' :
                        'Team Name'}
                  </Label>
                  <Input
                    id="team-name"
                    value={newTeam.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3"
                    placeholder={
                      newTeam.role === 'teacher' ? 'e.g. Prof. Amira Mansouri' :
                        newTeam.role === 'company' ? 'e.g. Sonatrach' :
                          'Enter team name'
                    }
                  />
                </div>

                {/* Leader/Rep Name - Only for Team Leader & Company, Teacher Name is entity name */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="leader-name" className="text-right">
                    {newTeam.role === 'company' ? 'Representative' :
                      newTeam.role === 'teacher' ? 'Teacher Name' :
                        'Leader Name'}
                  </Label>
                  <Input
                    id="leader-name"
                    value={newTeam.leader}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam(prev => ({ ...prev, leader: e.target.value }))}
                    className="col-span-3"
                    placeholder={
                      newTeam.role === 'company' ? 'Name of contact person' :
                        'Enter leader name'
                    }
                  />
                </div>


                {/* Bac Info - Only for Team Leader */}
                {newTeam.role === 'team-leader' && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="leader-bac-year" className="text-right">Bac Year</Label>
                      <Input
                        id="leader-bac-year"
                        value={newTeam.bacYear}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam(prev => ({ ...prev, bacYear: e.target.value }))}
                        className="col-span-3"
                        placeholder="e.g. 2020"
                        maxLength={4}
                        inputMode="numeric"
                        pattern="\d{4}"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="leader-bac-matricule" className="text-right">Bac Matricule</Label>
                      <Input
                        id="leader-bac-matricule"
                        value={newTeam.bacMatricule}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam(prev => ({ ...prev, bacMatricule: e.target.value }))}
                        className="col-span-3"
                        placeholder="8 digits"
                        maxLength={8}
                        inputMode="numeric"
                        pattern="\d{8}"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="leader-email" className="text-right">Email</Label>
                  <Input
                    id="leader-email"
                    type="email"
                    value={newTeam.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam(prev => ({ ...prev, email: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter email address"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">Username</Label>
                  <Input
                    id="username"
                    value={newTeam.username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam(prev => ({ ...prev, username: e.target.value }))}
                    className="col-span-3"
                    placeholder="Login username"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newTeam.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam(prev => ({ ...prev, password: e.target.value }))}
                    className="col-span-3"
                    placeholder="Login password"
                  />
                </div>

                {/* Location - Only for Company & Team Leader */}
                {(newTeam.role === 'company' || newTeam.role === 'team-leader') && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="location" className="text-right">Location</Label>
                    <Input
                      id="location"
                      value={newTeam.location}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam(prev => ({ ...prev, location: e.target.value }))}
                      className="col-span-3"
                      placeholder={
                        newTeam.role === 'company' ? 'e.g. Algiers HQ / Lab 3' :
                          'Enter University name'
                      }
                    />
                  </div>
                )}

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Textarea
                    id="description"
                    value={newTeam.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={isLoading} onClick={handleAddTeam} className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isRequestsModalOpen} onOpenChange={setIsRequestsModalOpen}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Creator Requests</DialogTitle>
                <DialogDescription>
                  Review and manage applications from users who want to become creators.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {creatorRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No pending creator requests.</p>
                  </div>
                ) : (
                  creatorRequests.map(req => (
                    <Card key={req.id} className={`overflow-hidden transition-all duration-200 ${expandedRequestId === req.id ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'hover:border-primary/50'}`}>
                      <CardContent className="p-0">
                        <div
                          className="p-4 flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedRequestId(expandedRequestId === req.id ? null : req.id)}
                        >
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                                {getInitials(req.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-bold text-lg leading-none mb-1 text-foreground">{req.name}</h3>
                              <div className="flex items-center text-sm text-muted-foreground space-x-2">
                                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">{req.role}</Badge>
                                {requestExistence[req.id] && (
                                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-green-500 text-green-600 bg-green-50">User Found</Badge>
                                )}
                                <span>•</span>
                                <span>{req.date || new Date().toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            {expandedRequestId === req.id ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                          </div>
                        </div>

                        {expandedRequestId === req.id && (
                          <div className="p-4 pt-0 bg-muted/20 border-t">
                            <div className="grid grid-cols-2 gap-4 my-4 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Representative / Teacher</p>
                                <p className="font-medium text-foreground flex items-center"><User className="h-3 w-3 mr-1" /> {req.leader}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Contact Email</p>
                                <p className="font-medium text-foreground flex items-center"><Mail className="h-3 w-3 mr-1" /> {req.email}</p>
                              </div>
                              {req.username && (
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Requested Username</p>
                                  <p className="font-medium text-foreground flex items-center">@{req.username}</p>
                                </div>
                              )}
                              {req.location && (
                                <div className={req.username ? "" : "col-span-2"}>
                                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Location</p>
                                  <p className="font-medium text-foreground flex items-center"><MapPin className="h-3 w-3 mr-1" /> {req.location}</p>
                                </div>
                              )}
                              <div className="col-span-2">
                                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Description / Reason</p>
                                <p className="text-foreground bg-background p-3 rounded-lg border">{req.description}</p>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2 mt-6">
                              <Button variant="destructive" onClick={() => handleDenyRequest(req.id)}>Deny Request</Button>
                              <Button onClick={() => handleAcceptRequest(req)} className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white">Accept & Create</Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-brand-600" />
                <span className="text-lg font-semibold">All Creators ({teams.length})</span>
              </CardTitle>
              <CardDescription className="mt-2 text-sm text-muted-foreground">
                Click on a team row to view members and manage team details
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Label htmlFor="sort-teams" className="text-sm text-muted-foreground">Sort by:</Label>
              <Select value={`${sortField}-${sortDirection}`} onValueChange={(value: string) => {
                const [field, direction] = value.split('-') as [SortField, SortDirection];
                setSortField(field);
                setSortDirection(direction);
              }}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Creator A-Z</SelectItem>
                  <SelectItem value="name-desc">Creator Z-A</SelectItem>
                  <SelectItem value="leader-asc">Creator Name A-Z</SelectItem>
                  <SelectItem value="leader-desc">Creator Name Z-A</SelectItem>
                  <SelectItem value="category-asc">Role A-Z</SelectItem>
                  <SelectItem value="category-desc">Role Z-A</SelectItem>
                  <SelectItem value="joinDate-desc">Newest</SelectItem>
                  <SelectItem value="joinDate-asc">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedTeams.length === teams.length && teams.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all creators"
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Role</span>
                    {getSortIcon('category')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('leader')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Creator Name</span>
                    {getSortIcon('leader')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Team Name</span>
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('joinDate')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Join Date</span>
                    {getSortIcon('joinDate')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('events')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Events</span>
                    {getSortIcon('events')}
                  </div>
                </TableHead>
                <TableHead className="w-12">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTeams.length > 0 ? sortedTeams.map((team) => (
                <React.Fragment key={team.id}>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedTeams.includes(team.id)}
                        onCheckedChange={() => handleSelectTeam(team.id)}
                        aria-label={`Select ${team.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRoleColor(team.category === 'company' ? 'company' : team.category === 'team-leader' ? 'team-leader' : 'teacher')}>
                        {team.category === 'company' ? 'Company' : team.category === 'team-leader' ? 'Club' : 'Teacher'}
                      </Badge>
                    </TableCell>
                    <TableCell>{team.leader}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                            {getInitials(team.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {team.name.replace(/^University of\s+/i, 'Uni ')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{team.email}</TableCell>
                    <TableCell>{team.joinDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                        {team.events}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTeam(team)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              )) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No teams found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.isPromotion ? () => handlePromoteUser(confirmDialog.team, confirmDialog.team.existingUser) : executeDeletion}
        title={confirmDialog.isPromotion ? 'Promote to Creator' : (confirmDialog.isTeacher ? 'Remove Teacher Access' : 'Delete Creator Entity')}
        description={
          confirmDialog.isPromotion
            ? `An account for "${confirmDialog.team?.email}" already exists. Would you like to directly promote ${confirmDialog.team?.leader} to a creator?`
            : (confirmDialog.isTeacher
              ? `Are you sure you want to remove ${confirmDialog.team?.name} as a creator? Their events will be permanently deleted, but their university account will remain active.`
              : `Are you sure you want to delete "${confirmDialog.team?.name}"? This will permanently remove the team, its representative (${confirmDialog.team?.leader}), and all associated events.`)
        }
        type={confirmDialog.isPromotion ? 'info' : 'danger'}
        confirmLabel={confirmDialog.isPromotion ? 'Promote Now' : (confirmDialog.isTeacher ? 'Remove Access' : 'Delete Everything')}
        isLoading={isLoading}
      />
    </div>
  );
}
