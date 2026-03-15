import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
    Users,
    Search,
    RefreshCw,
    User,
    Building,
    Mail,
    Calendar,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { api } from '../services/api';
import { formatDate } from '../utils/dateUtils';

interface MemberTeamProps {
    currentUser: any;
}

type SortField = 'name' | 'department' | 'role' | 'email' | 'joinDate';
type SortDirection = 'asc' | 'desc';

export function MemberTeam({ currentUser }: MemberTeamProps) {
    const [members, setMembers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const fetchTeamData = async () => {
        if (!currentUser?.teamId) return;

        setIsLoading(true);
        try {
            const response = await api.users.get({ team_id: currentUser.teamId });

            if (response.success && Array.isArray(response.data)) {
                setMembers(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch team members', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamData();
    }, [currentUser]);

    const filteredMembers = useMemo(() => {
        return members.filter(member =>
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (member.department_name && member.department_name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [members, searchQuery]);

    // Custom role order: team-leader > dept-head > member
    const getRoleOrder = (role: string): number => {
        switch (role) {
            case 'team-leader': return 1;
            case 'dept-head': return 2;
            case 'member': return 3;
            default: return 4;
        }
    };

    const sortedMembers = useMemo(() => {
        return [...filteredMembers].sort((a, b) => {
            let aValue = sortField === 'department' ? (a.department_name || 'Unassigned') :
                sortField === 'joinDate' ? (a.join_date || a.created_at || '') :
                    a[sortField];
            let bValue = sortField === 'department' ? (b.department_name || 'Unassigned') :
                sortField === 'joinDate' ? (b.join_date || b.created_at || '') :
                    b[sortField];

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
    }, [filteredMembers, sortField, sortDirection]);

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

    const getInitials = (name: string) => {
        return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'team-leader':
                return 'text-purple-700 border-purple-300 bg-purple-100 dark:bg-purple-700/20 dark:text-purple-200 dark:border-purple-600';
            case 'dept-head':
                return 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-700/20 dark:text-blue-200 dark:border-blue-600';
            case 'member':
                return 'text-green-600 border-green-200 bg-green-50 dark:bg-green-700/20 dark:text-green-200 dark:border-green-600';
            default:
                return 'text-muted-foreground border-border bg-muted/50';
        }
    };

    const stats = [
        {
            label: 'Total Members',
            value: members.length,
            icon: Users,
            description: 'in team'
        },
        {
            label: 'Department Heads',
            value: members.filter(m => m.role === 'dept-head').length,
            icon: User,
            description: 'heads'
        },
        {
            label: 'Regular Members',
            value: members.filter(m => m.role === 'member').length,
            icon: User,
            description: 'members'
        }
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">My Team</h1>
                    <p className="text-muted-foreground mt-2">
                        View all members in your team
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchTeamData} disabled={isLoading} className="w-full md:w-auto">
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className="border-0 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                                <stat.icon className="h-3 w-3" />
                                <span className="text-xs text-muted-foreground">{stat.description}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Members Table */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                        <div>
                            <CardTitle className="flex items-center space-x-2">
                                <Users className="h-5 w-5 text-brand-600" />
                                <span className="text-lg font-semibold">All Team Members ({sortedMembers.length})</span>
                            </CardTitle>
                            <CardDescription className="mt-2 text-sm text-muted-foreground">
                                Complete list of team members across all departments
                            </CardDescription>
                        </div>
                    </div>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search by name, email, or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
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
                                    onClick={() => handleSort('department')}
                                >
                                    <div className="flex items-center space-x-2">
                                        <span>Department</span>
                                        {getSortIcon('department')}
                                    </div>
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
                                    onClick={() => handleSort('email')}
                                >
                                    <div className="flex items-center space-x-2">
                                        <span>Email</span>
                                        {getSortIcon('email')}
                                    </div>
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedMembers.map((member) => (
                                <TableRow key={member.id} className="hover:bg-muted/50">
                                    <TableCell>
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={member.avatar} alt={member.name} />
                                                <AvatarFallback className="bg-gradient-to-br from-brand-500 to-purple-600 text-white text-xs">
                                                    {getInitials(member.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-foreground">{member.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Building className="h-4 w-4 text-muted-foreground" />
                                            <span>{member.department_name || 'Unassigned'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getRoleColor(member.role)}>
                                            {member.role.replace('-', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{member.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{formatDate(member.join_date || member.created_at)}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {sortedMembers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No members found matching your search criteria.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
