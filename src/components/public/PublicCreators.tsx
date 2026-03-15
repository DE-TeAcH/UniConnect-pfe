import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { usePublicStore } from '../../contexts/PublicStoreContext';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';

export function PublicCreators() {
    const { user, requireLogin, followCreator, unfollowCreator, followedCreatorIds, navigateTo } = usePublicStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name-asc');
    const [allCreators, setAllCreators] = useState<any[]>([]);

    useEffect(() => {
        const fetchCreators = async () => {
            try {
                const res = await api.users.get();
                if (res.success && Array.isArray(res.data)) {
                    setAllCreators(res.data.filter((u: any) =>
                        (u.role === 'teacher' ||
                            u.role === 'company' ||
                            u.role === 'team_leader' ||
                            u.role === 'team-leader') &&
                        u.manage === 1
                    ));
                }
            } catch (e) { console.error('Failed to fetch creators', e); }
        };
        fetchCreators();
    }, []);

    const handleFollow = (e: React.MouseEvent, creatorId: string | number) => {
        e.preventDefault();
        e.stopPropagation();
        requireLogin(() => {
            if (followedCreatorIds.includes(creatorId)) {
                unfollowCreator(creatorId);
                toast.info('Unfollowed creator');
            } else {
                followCreator(creatorId);
                toast.success('Following creator');
            }
        });
    };

    const getRoleGradient = (role: string) => {
        switch (role) {
            case 'teacher':
                return 'from-blue-500/30 to-blue-500/5';
            case 'company':
                return 'from-purple-500/30 to-purple-500/5';
            case 'team-leader':
                return 'from-amber-500/30 to-amber-500/5';
            default:
                return 'from-primary/30 to-primary/5';
        }
    };

    const getRoleTextColor = (role: string) => {
        switch (role) {
            case 'teacher':
                return 'text-blue-600 dark:text-blue-400';
            case 'company':
                return 'text-purple-600 dark:text-purple-400';
            case 'team-leader':
                return 'text-amber-600 dark:text-amber-400';
            default:
                return 'text-primary';
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'teacher':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300';
            case 'company':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300';
            case 'team-leader':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300';
            default:
                return '';
        }
    };

    const filteredCreators = useMemo(() => {
        let result = [...allCreators];

        if (roleFilter !== 'all') {
            result = result.filter(c => c.role === roleFilter);
        }

        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(c =>
                (c.full_name || c.username || '').toLowerCase().includes(lowerQuery) ||
                c.role.replace('_', ' ').toLowerCase().includes(lowerQuery) ||
                (c.faculty?.toLowerCase() || '').includes(lowerQuery) ||
                (c.location?.toLowerCase() || '').includes(lowerQuery)
            );
        }

        result.sort((a, b) => {
            const nameA = a.full_name || a.username || '';
            const nameB = b.full_name || b.username || '';
            switch (sortBy) {
                case 'name-asc':
                    return nameA.localeCompare(nameB);
                case 'name-desc':
                    return nameB.localeCompare(nameA);
                case 'followers-desc':
                    return (b.follower_count || 0) - (a.follower_count || 0);
                case 'events-desc':
                    return (b.event_count || 0) - (a.event_count || 0);
                default:
                    return 0;
            }
        });

        return result;
    }, [allCreators, searchQuery, roleFilter, sortBy]);

    return (
        <div className="space-y-8">
            <div className="mb-8 space-y-6">
                <div className="space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight">Creators</h1>
                    <p className="text-muted-foreground text-lg">Discover and follow teachers, clubs, and companies.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative w-full max-w-xl">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, faculty, company..."
                            className="pl-10 h-11 text-base bg-background rounded-full border-muted-foreground/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="flex h-11 w-full md:w-36 items-center justify-between rounded-md border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            <option value="all">Role</option>
                            <option value="company">Companies</option>
                            <option value="teacher">Teachers</option>
                            <option value="team-leader">Teams</option>
                        </select>

                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="flex h-11 w-full md:w-44 items-center justify-between rounded-md border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="events-desc">Most Events</option>
                            <option value="followers-desc">Most Followers</option>
                        </select>
                    </div>
                </div>
            </div>

            {filteredCreators.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 border-dashed border rounded-xl">
                    <p className="text-muted-foreground text-lg mb-4">No creators found matching "{searchQuery}"</p>
                    <Button variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCreators.map(creator => {
                        const isFollowing = followedCreatorIds.includes(creator.id);
                        const isSelf = user?.id === creator.id;
                        const displayName = creator.full_name || creator.username || 'Unknown';
                        const creatorRole = creator.role === 'team_leader' ? 'team-leader' : creator.role;

                        return (
                            <div key={creator.id} className="cursor-pointer" onClick={() => navigateTo('creator-profile', creator.id)}>
                                <Card className="h-full hover:-translate-y-1 transition-transform duration-300 hover:shadow-lg border-muted group relative overflow-hidden">
                                    <div className={`h-24 bg-gradient-to-br ${getRoleGradient(creatorRole)} absolute top-0 left-0 right-0`} />

                                    <CardContent className="p-6 pt-12 text-center relative z-10">
                                        <div className={`w-20 h-20 mx-auto rounded-full bg-background border-4 border-background shadow-md flex items-center justify-center font-bold text-3xl uppercase mb-4 ${getRoleTextColor(creatorRole)}`}>
                                            {displayName.charAt(0)}
                                        </div>

                                        <h3 className={`font-bold text-lg mb-0.5 transition-colors line-clamp-1 group-hover:text-primary`}>{displayName}</h3>
                                        {(creator.faculty || creator.location) && (
                                            <p className="text-xs text-muted-foreground mb-3 truncate px-2">
                                                {creatorRole === 'team-leader'
                                                    ? [creator.faculty, creator.location].filter(Boolean).join(' • ')
                                                    : (creator.faculty || creator.location)}
                                            </p>
                                        )}
                                        <Badge variant="outline" className={`mb-4 uppercase tracking-wider text-[10px] ${getRoleBadgeColor(creatorRole)}`}>
                                            {creatorRole === 'team-leader' ? 'team' : creatorRole.replace('-', ' ')}
                                        </Badge>

                                        <div className="flex justify-center gap-6 mt-2 mb-6 text-sm">
                                            <div className="text-center">
                                                <p className="font-bold text-foreground">{creator.event_count || 0}</p>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Events</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-foreground">
                                                    {(creator.follower_count || 0) + (isFollowing ? 1 : 0)}
                                                </p>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Followers</p>
                                            </div>
                                        </div>

                                        {!isSelf && (
                                            <Button
                                                variant={isFollowing ? 'secondary' : 'default'}
                                                className="w-full relative z-20"
                                                onClick={(e) => handleFollow(e, creator.id)}
                                            >
                                                {isFollowing ? 'Unfollow' : 'Follow'}
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
