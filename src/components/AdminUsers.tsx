// AdminUsers.tsx
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Users,
  User,
  Mail,
  Plus,
  Trash2,
  Building,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  RefreshCw,
  Edit,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { formatDisplayDate } from '../utils/dates';
import { toast } from 'sonner';
import { ConfirmationDialog } from './ui/ConfirmationDialog';

interface User {
  id: number;
  name: string;
  username: string;
  team: string;
  role: string;
  email: string;
  joinDate: string;
  teamId: number;
  avatar?: string;
  manage: boolean;
  bacMatricule?: string;
  bacYear?: number;
}

type SortField = 'name' | 'username' | 'team' | 'role' | 'email' | 'joinDate';
type SortDirection = 'asc' | 'desc';

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    user: User | null;
    hasTeam: boolean;
    isBulk: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    user: null,
    hasTeam: false,
    isBulk: false,
    message: '',
    onConfirm: () => { },
  });
  const [teamsList, setTeamsList] = useState<{ id: number, name: string }[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersResponse, teamsResponse] = await Promise.all([
        api.users.get(),
        api.teams.get()
      ]);

      console.log('Users API Response:', usersResponse);
      if (usersResponse.success && Array.isArray(usersResponse.data)) {
        const mappedUsers = usersResponse.data.map((u: any) => ({
          id: u.id,
          name: u.full_name || u.name || '',
          username: u.username || '',
          team: u.team_name || (['student', 'teacher'].includes(u.role) ? 'University' : 'Unassigned'),
          role: u.role,
          email: u.email,
          joinDate: formatDisplayDate(u.join_date || u.created_at),
          teamId: u.team_id || 0,
          avatar: u.avatar,
          manage: Boolean(u.manage),
          // map bac fields from API if present
          bacMatricule: u.bac_matricule ?? undefined,
          bacYear: u.bac_year ? Number(u.bac_year) : undefined
        }));
        console.log('Mapped Users:', mappedUsers);
        setUsers(mappedUsers);
      }

      if (teamsResponse.success && Array.isArray(teamsResponse.data)) {
        setTeamsList(teamsResponse.data.map((t: any) => ({ id: t.id, name: t.name })));
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    team: '',
    role: 'member' as User['role'],
    email: '',
    joinDate: '',
    bacMatricule: '',
    bacYear: ''
  });

  const [editUser, setEditUser] = useState({
    name: '',
    username: '',
    password: '',
    team: '',
    teamId: 0,
    role: 'member' as User['role'],
    email: '',
    bacMatricule: '',
    bacYear: ''
  });


  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.team || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.role || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Custom role order
  const getRoleOrder = (role: string): number => {
    switch (role?.toLowerCase()) {
      case 'teacher': return 1;
      case 'company': return 2;
      case 'team-leader':
      case 'team_leader': return 3;
      default: return 4;
    }
  };

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Use custom role ordering when sorting by role
      if (sortField === 'role') {
        const aOrder = getRoleOrder(a.role);
        const bOrder = getRoleOrder(b.role);
        if (sortDirection === 'asc') {
          return aOrder - bOrder;
        } else {
          return bOrder - aOrder;
        }
      }

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
  }, [filteredUsers, sortField, sortDirection]);

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

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter((id: number) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === sortedUsers.length ? [] : sortedUsers.map((user: User) => user.id)
    );
  };

  const executeBulkDeletion = async () => {
    setIsLoading(true);
    try {
      for (const userId of selectedUsers) {
        await api.users.delete(String(userId));
      }
      toast.success(`${selectedUsers.length} users deleted successfully`);
      fetchData();
      setSelectedUsers([]);
    } catch (error) {
      console.error('Failed to delete selected users', error);
      toast.error('Failed to delete selected users');
    } finally {
      setIsLoading(false);
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleDeleteSelected = () => {
    setConfirmDialog({
      isOpen: true,
      user: null,
      hasTeam: false,
      isBulk: true,
      message: `Are you sure you want to delete ${selectedUsers.length} users?`,
      onConfirm: executeBulkDeletion,
    });
  };

  const handleDeleteUser = (user: User) => {
    const hasTeam = user.teamId && ['company', 'team-leader', 'team_leader'].includes(user.role.toLowerCase());
    const message = hasTeam
      ? `This user has a representing team (${user.team}). The team and all its data will be deleted with it. Proceed?`
      : 'Are you sure you want to delete this user?';

    setConfirmDialog({
      isOpen: true,
      user,
      hasTeam,
      isBulk: false,
      message,
      onConfirm: () => executeDeletion(user, hasTeam),
    });
  };

  const executeDeletion = async (user: User, hasTeam: boolean) => {
    setIsLoading(true);
    try {
      if (hasTeam) {
        // Delete team first (cascade might handle user, but we'll be explicit if needed)
        await api.teams.delete(String(user.teamId));
      }

      const response = await api.users.delete(String(user.id));
      if (response.success) {
        fetchData();
        setSelectedUsers(prev => prev.filter((id: number) => id !== user.id));
        toast.success(hasTeam ? 'User and team deleted successfully' : 'User deleted successfully');
      } else {
        toast.error(response.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Failed to delete user', error);
      toast.error('Failed to delete user');
    } finally {
      setIsLoading(false);
      setConfirmDialog(prev => ({ ...prev, isOpen: false, user: null }));
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      name: user.name,
      username: user.username,
      password: '',
      team: user.team,
      teamId: user.teamId,
      role: user.role,
      email: user.email,
      bacMatricule: user.bacMatricule ?? '',
      bacYear: user.bacYear ? String(user.bacYear) : ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    // basic bac matricule validation: must be empty or exactly 8 digits
    const matricule = editUser.bacMatricule?.trim();
    if (matricule && !/^\d{8}$/.test(matricule)) {
      toast.error('Bac matricule must be exactly 8 digits.');
      return;
    }

    // bac year validation (optional): should be a reasonable 4-digit year if provided
    const yearStr = editUser.bacYear?.trim();
    if (yearStr && !/^\d{4}$/.test(yearStr)) {
      toast.error('Bac year must be a 4-digit year (e.g. 2018).');
      return;
    }

    try {
      setIsUpdating(true);
      const updateData: any = {
        name: editUser.name,
        username: editUser.username,
        email: editUser.email,
        role: editUser.role,
      };

      // Only include password if it's been changed
      if (editUser.password && editUser.password.trim() !== '') {
        updateData.password = editUser.password;
      }

      // Include bac fields if present (allow clearing by sending null)
      if (matricule !== undefined) {
        updateData.bac_matricule = matricule === '' ? null : matricule;
      }
      if (yearStr !== undefined) {
        updateData.bac_year = yearStr === '' ? null : Number(yearStr);
      }

      const response = await api.users.update(String(selectedUser.id), updateData);

      if (response.success) {
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        fetchData();
        toast.success('User updated successfully!');
      } else {
        toast.error(response.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddUser = async () => {
    // Validate Bac Year vs Join Date
    if (newUser.joinDate && newUser.bacYear) {
      const joinYear = new Date(newUser.joinDate).getFullYear();
      const bacYearNum = Number(newUser.bacYear);
      if (joinYear < bacYearNum) {
        toast.error('Join date cannot be before the Baccalaureate year.');
        return;
      }
    }

    if (newUser.name && newUser.username && newUser.password && newUser.email && newUser.team) {
      try {
        const selectedTeam = teamsList.find(t => t.name === newUser.team);
        const response = await api.users.create({
          name: newUser.name,
          username: newUser.username,
          password: newUser.password,
          email: newUser.email,
          role: newUser.role,
          team_id: selectedTeam ? selectedTeam.id : undefined,
          join_date: newUser.joinDate || undefined,
          bac_matricule: newUser.bacMatricule || undefined,
          bac_year: newUser.bacYear || undefined
        });

        if (response.success) {
          fetchData();
          setNewUser({ name: '', username: '', password: '', team: '', role: 'member', email: '', joinDate: '', bacMatricule: '', bacYear: '' });
          setIsAddDialogOpen(false);
          toast.success('User created successfully!');
        } else {
          toast.error(response.message || 'Failed to create user');
        }
      } catch (error) {
        toast.error('Failed to create user');
      }
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
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
            Manage all creators (Teachers, Companies, Team Leaders) on the platform
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {selectedUsers.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Selected ({selectedUsers.length})</span>
            </Button>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-brand-600" />
                <span className="text-lg font-semibold">All Users ({sortedUsers.length})</span>
              </CardTitle>
              <CardDescription className="mt-2 text-sm text-muted-foreground">
                Manage all user accounts and team assignments
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full md:w-64"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2 mt-4">
            <Label htmlFor="sort-users" className="text-sm text-muted-foreground">Sort by:</Label>
            <Select value={`${sortField}-${sortDirection}`} onValueChange={(value: string) => {
              const [field, direction] = value.split('-') as [SortField, SortDirection];
              setSortField(field);
              setSortDirection(direction);
            }}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="username-asc">Username A-Z</SelectItem>
                <SelectItem value="username-desc">Username Z-A</SelectItem>
                <SelectItem value="team-asc">Team A-Z</SelectItem>
                <SelectItem value="team-desc">Team Z-A</SelectItem>
                <SelectItem value="role-asc">Role (Leader → Member)</SelectItem>
                <SelectItem value="role-desc">Role (Member → Leader)</SelectItem>
                <SelectItem value="email-asc">Email A-Z</SelectItem>
                <SelectItem value="email-desc">Email Z-A</SelectItem>
                <SelectItem value="joinDate-desc">Newest</SelectItem>
                <SelectItem value="joinDate-asc">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === sortedUsers.length && sortedUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all users"
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Role</span>
                    {getSortIcon('role')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Name</span>
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('team')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Team Name</span>
                    {getSortIcon('team')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('username')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Username</span>
                    {getSortIcon('username')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Email</span>
                    {getSortIcon('email')}
                  </div>
                </TableHead>
                <TableHead className="w-20 hidden md:table-cell">
                  Manage
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('joinDate')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Join Date</span>
                    {getSortIcon('joinDate')}
                  </div>
                </TableHead>
                <TableHead className="w-12">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleSelectUser(user.id)}
                      aria-label={`Select ${user.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleColor(user.role)}>
                      {user.role.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-brand-500 to-purple-600 text-white text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{user.team}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{user.username}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={user.manage ? "default" : "secondary"} className={user.manage ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300"}>
                      {user.manage ? 'True' : 'False'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{user.joinDate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sortedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    No users found matching your search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Leave password blank to keep current password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Name</Label>
              <Input
                id="edit-name"
                value={editUser.name}
                onChange={(e) => setEditUser(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-username" className="text-right">Username</Label>
              <Input
                id="edit-username"
                value={editUser.username}
                onChange={(e) => setEditUser(prev => ({ ...prev, username: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editUser.email}
                onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-password" className="text-right">New Password</Label>
              <Input
                id="edit-password"
                type="password"
                value={editUser.password}
                onChange={(e) => setEditUser(prev => ({ ...prev, password: e.target.value }))}
                className="col-span-3"
                placeholder="Leave blank to keep current"
              />
            </div>

            {/* BAC Fields for Edit User (Students & Team Leaders Only) */}
            {['student', 'team-leader', 'team_leader'].includes(editUser.role?.toLowerCase()) && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-bacMatricule" className="text-right">Bac Matricule</Label>
                  <Input
                    id="edit-bacMatricule"
                    value={editUser.bacMatricule}
                    onChange={(e) => setEditUser(prev => ({ ...prev, bacMatricule: e.target.value }))}
                    className="col-span-3"
                    placeholder="8 digits (optional)"
                    maxLength={8}
                    inputMode="numeric"
                    pattern="\d{8}"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-bacYear" className="text-right">Bac Year</Label>
                  <Input
                    id="edit-bacYear"
                    value={editUser.bacYear}
                    onChange={(e) => setEditUser(prev => ({ ...prev, bacYear: e.target.value }))}
                    className="col-span-3"
                    placeholder="e.g. 2020 (optional)"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="\d{4}"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isUpdating} onClick={handleUpdateUser} className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.hasTeam ? 'Delete User & Team' : 'Delete User'}
        description={
          confirmDialog.hasTeam
            ? `This user represents "${confirmDialog.user?.team}". Deleting them will also permanently remove the entire team and all its data. Are you sure?`
            : `Are you sure you want to delete ${confirmDialog.user?.name}? This action cannot be undone.`
        }
        type="danger"
        confirmLabel="Confirm Deletion"
        isLoading={isLoading}
      />
    </div>
  );
}
