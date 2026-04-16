import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { User, Mail, Lock, Trash2, AlertTriangle, UserCog, UserCircle } from 'lucide-react';
import { usePublicStore } from '../../contexts/PublicStoreContext';
import { toast } from 'sonner';
import { api } from '../../services/api';

export function PublicSettings() {
    const { user, requireLogin, login, logout } = usePublicStore();

    // User must be logged in to view 
    if (!user) {
        return (
            <div className="text-center py-20 space-y-4">
                <h1 className="text-3xl font-bold mb-4">You must be logged in to view settings.</h1>
                <Button onClick={() => requireLogin(() => { })}>Log In Now</Button>
            </div>
        );
    }

    const [profileData, setProfileData] = useState({
        name: user.name || '',
        username: user.username || '',
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

    const [notifications, setNotifications] = useState(true);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    // Real-time username check
    React.useEffect(() => {
        if (!profileData.username || profileData.username === user.username) {
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
    }, [profileData.username, user.username]);

    const handleUpdateProfile = async () => {
        if (!usernameStatus.isAvailable) {
            toast.error('Please choose an available username.');
            return;
        }

        try {
            const res = await api.users.update(String(user.id), {
                name: profileData.name,
                username: profileData.username
            });

            if (res.success) {
                // Update local storage/store if possible
                login({ ...user, name: profileData.name, username: profileData.username });
                setIsSuccessDialogOpen(true);
                setTimeout(() => setIsSuccessDialogOpen(false), 2000);
            } else {
                toast.error(res.message || 'Failed to update profile');
            }
        } catch (err) {
            toast.error('An error occurred');
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
            const res = await api.users.update(String(user.id), {
                password: passwordData.newPassword
            });

            if (res.success) {
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setIsSuccessDialogOpen(true);
                setTimeout(() => setIsSuccessDialogOpen(false), 2000);
            } else {
                toast.error(res.message || 'Failed to update password');
            }
        } catch (err) {
            toast.error('An error occurred while changing password');
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'DELETE') {
            toast.error('Please type DELETE to confirm account deletion.');
            return;
        }

        try {
            const res = await api.users.delete(String(user.id));
            if (res.success) {
                toast.success('Account deleted successfully');
                setIsDeleteDialogOpen(false);
                logout();
            } else {
                toast.error(res.message || 'Failed to delete account');
            }
        } catch (err) {
            toast.error('An error occurred while deleting account');
        }
    };

    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your public account settings and preferences
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Profile Overview Card */}
                <Card className="border-0 shadow-sm h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <UserCircle className="h-5 w-5 text-brand-600" />
                            <span>Profile</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col items-center space-y-4">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={''} alt={profileData.name} />
                                <AvatarFallback className="bg-gradient-to-br from-brand-500 to-purple-600 text-white text-2xl">
                                    {getInitials(profileData.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                                <h3 className="font-semibold text-foreground">{profileData.name || 'Public User'}</h3>
                                <p className="text-sm text-muted-foreground">@{profileData.username || 'user'}</p>
                                <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-700 border-blue-200`}>
                                    {user.role.toUpperCase()} USER
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Information */}
                <Card className="border-0 shadow-sm h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <UserCog className="h-5 w-5 text-brand-600" />
                            <span>Profile Information</span>
                        </CardTitle>
                        <CardDescription>
                            Update your public display name and username.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input
                                    id="name"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter your display name"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <div className="space-y-1">
                                    <Input
                                        id="username"
                                        value={profileData.username}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                                        placeholder="username"
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
                            disabled={!usernameStatus.isAvailable || usernameStatus.isChecking}
                            className="w-full bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0 mt-2"
                        >
                            {usernameStatus.isChecking ? 'Checking...' : 'Save Changes'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card className="border-0 shadow-sm h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Lock className="h-5 w-5 text-brand-600" />
                            <span>Change Password</span>
                        </CardTitle>
                        <CardDescription>
                            Update your password to keep your account secure
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <Button onClick={handleChangePassword} variant="outline" className="mt-2">
                                Update Password
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Preferences Map */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Mail className="h-5 w-5 text-brand-600" />
                            <span>Preferences</span>
                        </CardTitle>
                        <CardDescription>
                            Manage your notifications and alerts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                            <div className="space-y-0.5 max-w-[80%]">
                                <Label className="text-base font-medium">Email Notifications</Label>
                                <p className="text-sm text-muted-foreground mr-4">Receive emails about upcoming events you've applied to and creator updates.</p>
                            </div>
                            <Switch checked={notifications} onCheckedChange={setNotifications} />
                        </div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
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
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50 dark:bg-red-900/10 gap-4">
                            <div>
                                <h4 className="font-medium text-red-900 dark:text-red-200">Delete Account</h4>
                                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                    Permanently delete your account and all associated data
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="flex items-center space-x-2 w-full sm:w-auto shrink-0"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete Account</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                        }}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmation !== 'DELETE'}
                        >
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
