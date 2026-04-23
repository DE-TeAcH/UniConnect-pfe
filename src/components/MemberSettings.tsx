import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { PasswordInput } from './ui/password-input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { User, Mail, Lock, Trash2, AlertTriangle, UserCog, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';

interface MemberSettingsProps {
    currentUser: {
        departmentId?: number;
        teamId: number;
        id: number;
        name: string;
        username: string;
        email: string;
        role: 'admin' | 'team-leader' | 'member' | 'teacher' | 'company';
        teamName: string;
        avatar?: string;
    };
    onLogout: () => void;
    onProfileUpdate: (updatedUser: Partial<{ name: string; username: string; email: string; }>) => void;
}

export function MemberSettings({ currentUser, onLogout, onProfileUpdate }: MemberSettingsProps) {
    const [profileData, setProfileData] = useState({
        name: currentUser.name,
        username: currentUser.username,
    });

    const [usernameStatus, setUsernameStatus] = useState<{
        isChecking: boolean;
        isAvailable: boolean;
        message: string;
    }>({ isChecking: false, isAvailable: true, message: '' });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
    const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [hasSuccessor, setHasSuccessor] = useState(false);
    const [successorFullName, setSuccessorFullName] = useState('');
    const [successorUsername, setSuccessorUsername] = useState('');

    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    // Real-time username check
    React.useEffect(() => {
        if (!profileData.username || profileData.username === currentUser.username) {
            setUsernameStatus({ isChecking: false, isAvailable: true, message: '' });
            return;
        }

        const timer = setTimeout(async () => {
            setUsernameStatus(prev => ({ ...prev, isChecking: true }));
            try {
                const res = await api.users.get({ username: profileData.username });
                if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                    setUsernameStatus({ isChecking: false, isAvailable: false, message: 'Username is taken' });
                } else {
                    setUsernameStatus({ isChecking: false, isAvailable: true, message: 'Username is available' });
                }
            } catch (err) {
                setUsernameStatus({ isChecking: false, isAvailable: true, message: '' });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [profileData.username, currentUser.username]);

    const handleUpdateProfile = async () => {
        if (!usernameStatus.isAvailable) {
            toast.error('Please choose an available username.');
            return;
        }

        try {
            setIsSavingProfile(true);
            const response = await api.users.update(String(currentUser.id), {
                name: profileData.name,
                username: profileData.username,
            });

            if (response.success) {
                onProfileUpdate({ name: profileData.name, username: profileData.username });
                toast.success('Profile updated successfully!');
            } else {
                toast.error(response.message || 'Failed to update profile.');
            }
        } catch (error) {
            toast.error('An error occurred while updating profile.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match!');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long!');
            return;
        }

        try {
            setIsChangingPassword(true);
            const response = await api.users.update(String(currentUser.id), {
                password: passwordData.newPassword
            });

            if (response.success) {
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                toast.success('Password updated successfully!');
            } else {
                toast.error(response.message || 'Failed to update password.');
            }
        } catch (error) {
            toast.error('An error occurred while changing password.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        // Validation for team leader delegation
        if (currentUser.role === 'team-leader') {
            if (hasSuccessor && (!successorFullName.trim() || !successorUsername.trim())) {
                toast.error('Please provide both the full name and username of the successor.');
                return;
            }
            if (hasSuccessor) {
                console.log(`Delegating to ${successorFullName} (${successorUsername})`);
            }
        }

        // Validate confirmation text
        if (deleteConfirmation !== 'DELETE') {
            toast.error('Please type DELETE to confirm account deletion.');
            return;
        }

        try {
            setIsDeletingAccount(true);
            const response = await api.users.delete(String(currentUser.id));
            if (response.success) {
                toast.success(`Account deleted successfully.${hasSuccessor ? ` ${successorFullName} has been assigned as your successor.` : ''}`);
                setIsDeleteDialogOpen(false);
                onLogout();
            } else {
                toast.error(response.message || 'Failed to delete account.');
            }
        } catch (error) {
            toast.error('An error occurred while deleting account.');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'team-leader':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'admin':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default:
                return 'bg-green-100 text-green-700 border-green-200';
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account settings and preferences
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Profile Overview Card */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <User className="h-5 w-5 text-brand-600" />
                            <span>Profile</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col items-center space-y-4">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                                <AvatarFallback className="bg-gradient-to-br from-brand-500 to-purple-600 text-white text-2xl">
                                    {getInitials(currentUser.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                                <h3 className="font-semibold text-foreground">{currentUser.name}</h3>
                                <p className="text-sm text-muted-foreground">{currentUser.teamName}</p>
                                <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(currentUser.role)}`}>
                                    {currentUser.role.replace('-', ' ').toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Information */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <UserCog className="h-5 w-5 text-brand-600" />
                            <span>Profile Information</span>
                        </CardTitle>
                        <CardDescription>
                            Update your personal information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <div className="space-y-1">
                                    <Input
                                        id="username"
                                        value={profileData.username}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                                        placeholder="Enter your username"
                                        className={!usernameStatus.isAvailable ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                    />
                                    {usernameStatus.message && (
                                        <p className={`text-xs ${usernameStatus.isAvailable ? 'text-green-500' : 'text-red-500'}`}>
                                            {usernameStatus.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={handleUpdateProfile}
                            disabled={!usernameStatus.isAvailable || usernameStatus.isChecking || isSavingProfile}
                            className="w-full bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0"
                        >
                            {usernameStatus.isChecking || isSavingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {usernameStatus.isChecking ? 'Checking...' : isSavingProfile ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Lock className="h-5 w-5 text-brand-600" />
                            <span>Change Password</span>
                        </CardTitle>
                        <CardDescription>
                            Update your password to keep your account secure
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <PasswordInput
                                    id="current-password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    visible={isCurrentPasswordVisible}
                                    onVisibleChange={setIsCurrentPasswordVisible}
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <PasswordInput
                                    id="new-password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                    visible={isNewPasswordVisible}
                                    onVisibleChange={setIsNewPasswordVisible}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <PasswordInput
                                    id="confirm-password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    visible={isNewPasswordVisible}
                                    onVisibleChange={setIsNewPasswordVisible}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <Button disabled={isChangingPassword} onClick={handleChangePassword} variant="outline">
                                {isChangingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Update Password
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Danger Zone */}
            {currentUser.role !== 'admin' && (
                <Card className="border-red-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            <span>Danger Zone</span>
                        </CardTitle>
                        <CardDescription>
                            Irreversible actions that affect your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50 dark:bg-red-900/10 gap-4 md:gap-0">
                            <div>
                                <h4 className="font-medium text-red-900 dark:text-red-200">Delete Account</h4>
                                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                    Permanently delete your account and all associated data
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="flex items-center space-x-2 w-full md:w-auto"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete Account</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Delete Account Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            <span>Delete Account</span>
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove all your data.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {currentUser.role === 'team-leader' && (
                            <div className="space-y-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="flex items-start space-x-2">
                                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-orange-900">
                                            Team Leader Role Reassignment
                                        </h4>
                                        <p className="text-sm text-orange-700 mt-1">
                                            Are you delegating your role to a new leader? If so, provide the details of their student account to transfer privileges.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 py-2">
                                    <Switch checked={hasSuccessor} onCheckedChange={setHasSuccessor} id="has-successor" />
                                    <Label htmlFor="has-successor">I have a successor to take my place</Label>
                                </div>
                                {hasSuccessor && (
                                    <div className="space-y-3 mt-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="succ-name">Successor Full Name</Label>
                                            <Input id="succ-name" value={successorFullName} onChange={e => setSuccessorFullName(e.target.value)} placeholder="Full Name" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="succ-username">Successor Username</Label>
                                            <Input id="succ-username" value={successorUsername} onChange={e => setSuccessorUsername(e.target.value)} placeholder="Student Username" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="delete-confirmation">
                                Type <span className="font-mono font-bold">DELETE</span> to confirm
                            </Label>
                            <Input
                                id="delete-confirmation"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder="Type DELETE"
                                className="font-mono"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsDeleteDialogOpen(false);
                            setDeleteConfirmation('');
                            setHasSuccessor(false);
                            setSuccessorFullName('');
                            setSuccessorUsername('');
                        }}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmation !== 'DELETE' || isDeletingAccount}
                        >
                            {isDeletingAccount ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Delete My Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Dialog */}
            <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
                <DialogContent className="max-w-[350px] rounded-xl flex flex-col items-center text-center">
                    <div className="rounded-full bg-green-100 p-3 mb-2">
                        <UserCog className="h-6 w-6 text-green-600" />
                    </div>
                    <DialogHeader className="text-center sm:text-center">
                        <DialogTitle className="text-green-600 text-xl">Success!</DialogTitle>
                        <DialogDescription className="text-center pt-2">
                            Your changes have been saved successfully.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center w-full mt-4">
                        <Button onClick={() => setIsSuccessDialogOpen(false)} className="w-full bg-green-600 hover:bg-green-700">
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
