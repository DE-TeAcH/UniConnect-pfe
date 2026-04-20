import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { GraduationCap, ArrowRight, UserPlus, LogIn, ArrowLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { usePublicStore } from '../../contexts/PublicStoreContext';
import { toast } from 'sonner';
import { api } from '../../services/api';
import LightLogo from '../../assets/UniConnect_VLight.png';
import DarkLogo from '../../assets/UniConnect_Dark.png';

export function PublicAuth() {
    const { login, continueAsGuest } = usePublicStore();

    // Loading state
    const [isLoading, setIsLoading] = useState(false);

    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register State
    const [registerName, setRegisterName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerFaculty, setRegisterFaculty] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
    const [registerBacYear, setRegisterBacYear] = useState('');
    const [registerBacMatricule, setRegisterBacMatricule] = useState('');
    const [pinSent, setPinSent] = useState(false);
    const [verificationPin, setVerificationPin] = useState('');

    // Username check state
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Check if the email is a student email (contains 'etu.' after @)
    const isStudentEmail = registerEmail.includes('@etu.');

    // Forgot Password State
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPinSent, setForgotPinSent] = useState(false);
    const [forgotPin, setForgotPin] = useState('');
    const [isForgotPinVerified, setIsForgotPinVerified] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const isRegisterEmailValid = registerEmail === '' || registerEmail.endsWith('@univ-mosta.dz') || registerEmail.endsWith('@etu.univ-mosta.dz');
    const isForgotEmailValid = forgotPasswordEmail === '' || forgotPasswordEmail.endsWith('@univ-mosta.dz') || forgotPasswordEmail.endsWith('@etu.univ-mosta.dz');

    // Debounced username uniqueness check
    useEffect(() => {
        if (!registerUsername.trim() || registerUsername.length < 3) {
            setUsernameStatus('idle');
            return;
        }
        setUsernameStatus('checking');
        if (usernameTimer.current) clearTimeout(usernameTimer.current);
        usernameTimer.current = setTimeout(async () => {
            try {
                const res = await api.auth.checkUsername(registerUsername);
                if (res.success && res.data) {
                    setUsernameStatus(res.data.available ? 'available' : 'taken');
                }
            } catch {
                setUsernameStatus('idle');
            }
        }, 500);
        return () => { if (usernameTimer.current) clearTimeout(usernameTimer.current); };
    }, [registerUsername]);

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!forgotPinSent) {
            if (!forgotPasswordEmail.trim()) {
                toast.error('Please enter your email');
                return;
            }

            setIsLoading(true);
            try {
                const res = await api.auth.sendPin(forgotPasswordEmail, 'reset');
                if (res.success) {
                    setForgotPinSent(true);
                    toast.success('A 6-digit PIN has been sent to your email for password reset.');
                } else {
                    toast.error(res.message || 'Failed to send PIN.');
                }
            } catch {
                toast.error('Failed to send PIN. Please try again.');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (!isForgotPinVerified) {
            if (forgotPin.length !== 6 || !/^\d{6}$/.test(forgotPin)) {
                toast.error('Please enter a valid 6-digit PIN');
                return;
            }

            setIsLoading(true);
            try {
                const res = await api.auth.verifyPin(forgotPasswordEmail, forgotPin, 'reset');
                if (res.success) {
                    setIsForgotPinVerified(true);
                    toast.success('PIN verified! Please enter your new password.');
                } else {
                    toast.error(res.message || 'Invalid or expired PIN.');
                }
            } catch {
                toast.error('Failed to verify PIN. Please try again.');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (newPassword !== confirmNewPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.auth.resetPassword(forgotPasswordEmail, newPassword);
            if (res.success) {
                toast.success('Password reset successfully! You can now log in.');
                setIsForgotPassword(false);
                setForgotPinSent(false);
                setIsForgotPinVerified(false);
                setForgotPin('');
                setForgotPasswordEmail('');
                setNewPassword('');
                setConfirmNewPassword('');
            } else {
                toast.error(res.message || 'Failed to reset password.');
            }
        } catch {
            toast.error('Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!loginEmail.trim() || !loginPassword.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            const res = await api.auth.login(loginEmail, loginPassword);
            if (res.success && res.data) {
                const userData = res.data;

                if (userData.role === 'admin') {
                    toast.error('Administrators do not have access to the public platform.');
                    return;
                }

                login({
                    id: userData.id,
                    name: userData.full_name || userData.name || userData.username,
                    email: userData.email,
                    username: userData.username,
                    role: userData.role,
                    manage: userData.manage,
                    affiliation: userData.affiliation
                });
                toast.success('Successfully logged in!');
            } else {
                toast.error(res.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('An error occurred during login.');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!pinSent) {
            if (!registerName.trim() || !registerEmail.trim() || !registerFaculty.trim() || !registerUsername.trim() || !registerPassword.trim() || !registerConfirmPassword.trim()) {
                toast.error('Please fill in all fields');
                return;
            }

            if (isStudentEmail) {
                if (!registerBacYear.trim() || !registerBacMatricule.trim()) {
                    toast.error('Please fill in your BAC year and BAC matricule');
                    return;
                }
                if (!/^\d{4}$/.test(registerBacYear)) {
                    toast.error('BAC year must be 4 digits');
                    return;
                }
                if (!/^\d{8}$/.test(registerBacMatricule)) {
                    toast.error('BAC matricule must be 8 digits');
                    return;
                }
            }

            const isValidDomain = registerEmail.endsWith('@univ-mosta.dz') || registerEmail.endsWith('@etu.univ-mosta.dz') || registerEmail.endsWith('@gmail.com');
            if (!isValidDomain) {
                toast.error('Please use a valid university email (@univ-mosta.dz or @etu.univ-mosta.dz)');
                return;
            }

            if (registerPassword !== registerConfirmPassword) {
                toast.error('Passwords do not match');
                return;
            }

            if (usernameStatus === 'taken') {
                toast.error('This username is already taken. Please choose another.');
                return;
            }

            setIsLoading(true);
            try {
                const res = await api.auth.sendPin(registerEmail, 'register');
                if (res.success) {
                    setPinSent(true);
                    toast.success('A 6-digit PIN has been sent to your email.');
                } else {
                    toast.error(res.message || 'Failed to send PIN.');
                }
            } catch {
                toast.error('Failed to send PIN. Please try again.');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (verificationPin.length !== 6 || !/^\d{6}$/.test(verificationPin)) {
            toast.error('Please enter a valid 6-digit PIN');
            return;
        }

        // Verify PIN first
        setIsLoading(true);
        try {
            const pinRes = await api.auth.verifyPin(registerEmail, verificationPin, 'register');
            if (!pinRes.success) {
                toast.error(pinRes.message || 'Invalid or expired PIN.');
                setIsLoading(false);
                return;
            }
        } catch {
            toast.error('Failed to verify PIN. Please try again.');
            setIsLoading(false);
            return;
        }

        // Register via API
        try {
            const registerData: any = {
                name: registerName,
                email: registerEmail,
                username: registerUsername,
                password: registerPassword,
                affiliation: registerFaculty,
            };
            if (isStudentEmail) {
                registerData.bac_matricule = registerBacMatricule;
                registerData.bac_year = parseInt(registerBacYear);
            }

            const res = await api.auth.register(registerData);
            if (res.success && res.data) {
                login({
                    id: res.data.id,
                    name: res.data.name || registerName,
                    email: res.data.email || registerEmail,
                    username: res.data.username || registerUsername,
                    role: res.data.role || (isStudentEmail ? 'student' : 'teacher')
                });
                toast.success('Account created successfully!');
            } else {
                toast.error(res.message || 'Registration failed.');
                setPinSent(false);
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('An error occurred during registration.');
            setPinSent(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestAccess = () => {
        continueAsGuest();
    };

    return (
        <div className="h-[100dvh] w-full bg-background overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="min-h-full flex flex-col justify-center items-center p-4 w-full">

                <div className="flex justify-center items-center mb-4">
                    <img src={LightLogo} alt="UniConnect Logo" className="dark:hidden h-32 w-auto object-contain" />
                    <img src={DarkLogo} alt="UniConnect Logo" className="hidden dark:block h-32 w-auto object-contain drop-shadow-sm" />
                </div>

                <Card className="w-full max-w-md shadow-xl border-border/50">
                    <div className="mt-6 text-center flex flex-col items-center">
                        <h3 className="text-3xl font-extrabold tracking-tight">Welcome to UniConnect</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">The all-in-one platform for university clubs, events, and networking.</p>
                    </div>
                    <Tabs defaultValue="login" className="w-full">
                        <CardHeader className="px-6 pt-1 pb-1">
                            <TabsList className="grid w-full grid-cols-2 bg-muted/70 dark:bg-zinc-800/80 p-1 rounded-2xl h-11">
                                <TabsTrigger
                                    value="login"
                                    className="rounded-xl data-[state=active]:bg-background dark:data-[state=active]:bg-[#18181b] dark:data-[state=active]:text-white dark:text-zinc-400 font-semibold"
                                    onClick={() => {
                                        setPinSent(false);
                                        setIsForgotPassword(false);
                                        setForgotPinSent(false);
                                        setIsForgotPinVerified(false);
                                    }}
                                >
                                    Login
                                </TabsTrigger>
                                <TabsTrigger
                                    value="register"
                                    className="rounded-xl data-[state=active]:bg-background dark:data-[state=active]:bg-[#18181b] dark:data-[state=active]:text-white dark:text-zinc-400 font-semibold"
                                >
                                    Register
                                </TabsTrigger>
                            </TabsList>
                        </CardHeader>

                        {/* LOGIN TAB */}
                        <TabsContent value="login">
                            <form onSubmit={isForgotPassword ? handleForgotPasswordSubmit : handleLogin}>
                                <CardContent className="space-y-4 px-6 pt-4">
                                    {!isForgotPassword ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="login-email">Email / Username</Label>
                                                <Input
                                                    id="login-email"
                                                    type="text"
                                                    placeholder="Enter your student email"
                                                    value={loginEmail}
                                                    onChange={(e) => setLoginEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="login-password">Password</Label>
                                                    <Button variant="link" className="p-0 h-auto text-xs font-normal" type="button" onClick={() => setIsForgotPassword(true)}>Forgot password?</Button>
                                                </div>
                                                <Input
                                                    id="login-password"
                                                    type="password"
                                                    placeholder="Enter your password"
                                                    value={loginPassword}
                                                    onChange={(e) => setLoginPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </>
                                    ) : !forgotPinSent ? (
                                        <>
                                            <div className="text-center space-y-2 mb-4">
                                                <h4 className="font-semibold">Reset Password</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Enter the email you used to open your account.
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="forgot-email">Email</Label>
                                                <Input
                                                    id="forgot-email"
                                                    type="email"
                                                    placeholder="your@email.com"
                                                    value={forgotPasswordEmail}
                                                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </>
                                    ) : !isForgotPinVerified ? (
                                        <div className="space-y-4 py-4">
                                            <div className="text-center space-y-2">
                                                <h4 className="font-semibold">Verify Your Email</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    We've sent a 6-digit PIN to <br /><strong>{forgotPasswordEmail}</strong>
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="forgot-pin" className="text-center block">Enter 6-digit PIN</Label>
                                                <Input
                                                    id="forgot-pin"
                                                    type="text"
                                                    maxLength={6}
                                                    className="text-center text-2xl tracking-widest h-12"
                                                    placeholder="000000"
                                                    value={forgotPin}
                                                    onChange={(e) => setForgotPin(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 py-4">
                                            <div className="text-center space-y-2 mb-4">
                                                <h4 className="font-semibold">Create New Password</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Please enter your new password below.
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="forgot-new-password">New Password</Label>
                                                <Input
                                                    id="forgot-new-password"
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="forgot-confirm-password">Confirm New Password</Label>
                                                <Input
                                                    id="forgot-confirm-password"
                                                    type="password"
                                                    value={confirmNewPassword}
                                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                    className={confirmNewPassword && confirmNewPassword !== newPassword ? "border-red-500 focus-visible:ring-red-500 text-red-500" : ""}
                                                    required
                                                />
                                                {confirmNewPassword && confirmNewPassword !== newPassword && (
                                                    <p className="text-[10px] text-red-500 font-medium ml-1">
                                                        Passwords do not match
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex flex-col gap-4 px-6 pb-6 pt-2">
                                    {!isForgotPassword ? (
                                        <Button className="w-full bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl" type="submit" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />} Sign In
                                        </Button>
                                    ) : !forgotPinSent ? (
                                        <div className="w-full space-y-3">
                                            <Button className="w-full bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl" type="submit" disabled={isLoading}>
                                                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Send Reset PIN
                                            </Button>
                                            <Button variant="ghost" className="w-full text-sm" type="button" onClick={() => setIsForgotPassword(false)}>
                                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                                            </Button>
                                        </div>
                                    ) : !isForgotPinVerified ? (
                                        <div className="w-full space-y-3">
                                            <Button className="w-full bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-2xl" type="submit" disabled={isLoading}>
                                                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Verify PIN
                                            </Button>
                                            <Button variant="ghost" className="w-full text-sm" type="button" onClick={() => setForgotPinSent(false)} disabled={isLoading}>
                                                <ArrowLeft className="w-4 h-4 mr-2" /> Change Email
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="w-full space-y-3">
                                            <Button className="w-full bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-2xl" type="submit" disabled={isLoading}>
                                                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Reset Password
                                            </Button>
                                        </div>
                                    )}
                                    {!isForgotPassword && (
                                        <>
                                            <div className="relative w-full">
                                                <div className="absolute inset-0 flex items-center">
                                                    <span className="w-full border-t" />
                                                </div>
                                                <div className="relative flex justify-center text-xs uppercase">
                                                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                                                </div>
                                            </div>
                                            <Button variant="outline" className="w-full" disabled={isLoading} type="button" onClick={handleGuestAccess}>
                                                Continue as Guest <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </>
                                    )}
                                </CardFooter>
                            </form>
                        </TabsContent>

                        {/* REGISTER TAB */}
                        <TabsContent value="register">
                            <form onSubmit={handleRegister}>
                                <CardContent className="space-y-4 px-6 pt-4">
                                    {!pinSent ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="register-name">Full Name</Label>
                                                <Input
                                                    id="register-name"
                                                    placeholder="Full Name"
                                                    value={registerName}
                                                    onChange={(e) => setRegisterName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="register-email">University Mail</Label>
                                                <Input
                                                    id="register-email"
                                                    type="email"
                                                    placeholder="name@university.edu"
                                                    value={registerEmail}
                                                    onChange={(e) => setRegisterEmail(e.target.value)}
                                                    className={!isRegisterEmailValid ? "border-red-500 text-red-500 focus-visible:ring-red-500" : ""}
                                                    required
                                                />
                                                <p className={`text-[10px] ml-1 ${!isRegisterEmailValid ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                                                    Must end in @univ-mosta.dz or @etu.univ-mosta.dz
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="register-faculty">Faculty</Label>
                                                    <Input
                                                        id="register-faculty"
                                                        placeholder="e.g. Computer Science"
                                                        value={registerFaculty}
                                                        onChange={(e) => setRegisterFaculty(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="register-username">Username</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="register-username"
                                                            placeholder="johndoe123"
                                                            value={registerUsername}
                                                            onChange={(e) => setRegisterUsername(e.target.value)}
                                                            className={`pr-8 ${usernameStatus === 'taken' ? 'border-red-500 focus-visible:ring-red-500 text-red-500' :
                                                                usernameStatus === 'available' ? 'border-green-500 focus-visible:ring-green-500' : ''
                                                                }`}
                                                            required
                                                        />
                                                        {usernameStatus === 'checking' && (
                                                            <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
                                                        )}
                                                        {usernameStatus === 'available' && (
                                                            <CheckCircle2 className="absolute right-2.5 top-2.5 h-4 w-4 text-green-500" />
                                                        )}
                                                        {usernameStatus === 'taken' && (
                                                            <XCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-red-500" />
                                                        )}
                                                    </div>
                                                    {usernameStatus === 'taken' && (
                                                        <p className="text-[10px] text-red-500 font-medium ml-1">Username is already taken</p>
                                                    )}
                                                </div>
                                            </div>
                                            {isStudentEmail && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="register-bac-year">BAC Year</Label>
                                                        <Input
                                                            id="register-bac-year"
                                                            placeholder="2023"
                                                            maxLength={4}
                                                            value={registerBacYear}
                                                            onChange={(e) => {
                                                                const v = e.target.value.replace(/\D/g, '');
                                                                setRegisterBacYear(v);
                                                            }}
                                                            className={registerBacYear && !/^\d{4}$/.test(registerBacYear) ? 'border-red-500 focus-visible:ring-red-500 text-red-500' : ''}
                                                            required
                                                        />
                                                        {registerBacYear && !/^\d{4}$/.test(registerBacYear) && (
                                                            <p className="text-[10px] text-red-500 font-medium ml-1">Must be 4 digits</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="register-bac-matricule">BAC Matricule</Label>
                                                        <Input
                                                            id="register-bac-matricule"
                                                            placeholder="12345678"
                                                            maxLength={8}
                                                            value={registerBacMatricule}
                                                            onChange={(e) => {
                                                                const v = e.target.value.replace(/\D/g, '');
                                                                setRegisterBacMatricule(v);
                                                            }}
                                                            className={registerBacMatricule && !/^\d{8}$/.test(registerBacMatricule) ? 'border-red-500 focus-visible:ring-red-500 text-red-500' : ''}
                                                            required
                                                        />
                                                        {registerBacMatricule && !/^\d{8}$/.test(registerBacMatricule) && (
                                                            <p className="text-[10px] text-red-500 font-medium ml-1">Must be 8 digits</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <Label htmlFor="register-password">Password</Label>
                                                <Input
                                                    id="register-password"
                                                    type="password"
                                                    value={registerPassword}
                                                    onChange={(e) => setRegisterPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="register-confirm">Confirm Password</Label>
                                                <Input
                                                    id="register-confirm"
                                                    type="password"
                                                    value={registerConfirmPassword}
                                                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                                                    className={registerConfirmPassword && registerConfirmPassword !== registerPassword ? "border-red-500 focus-visible:ring-red-500 text-red-500" : ""}
                                                    required
                                                />
                                                {registerConfirmPassword && registerConfirmPassword !== registerPassword && (
                                                    <p className="text-[10px] text-red-500 font-medium ml-1">
                                                        Passwords do not match
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-4 py-4">
                                            <div className="text-center space-y-2">
                                                <h4 className="font-semibold">Verify Your Email</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    We've sent a 6-digit PIN to <br /><strong>{registerEmail}</strong>
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="verification-pin" className="text-center block">Enter 6-digit PIN</Label>
                                                <Input
                                                    id="verification-pin"
                                                    type="text"
                                                    maxLength={6}
                                                    className="text-center text-2xl tracking-widest h-12"
                                                    placeholder="000000"
                                                    value={verificationPin}
                                                    onChange={(e) => setVerificationPin(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex flex-col gap-4 px-6 pb-6 pt-2">
                                    {!pinSent ? (
                                        <Button className="w-full bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl" type="submit" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />} Continue
                                        </Button>
                                    ) : (
                                        <div className="w-full space-y-3">
                                            <Button className="w-full bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-2xl" type="submit" disabled={isLoading}>
                                                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Verify & Create Account
                                            </Button>
                                            <Button variant="ghost" className="w-full text-sm" type="button" onClick={() => setPinSent(false)} disabled={isLoading}>
                                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Edit Details
                                            </Button>
                                        </div>
                                    )}
                                    <div className="relative w-full">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-card px-2 text-muted-foreground">Or</span>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full" disabled={isLoading} type="button" onClick={handleGuestAccess}>
                                        Continue as Guest <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardFooter>
                            </form>
                        </TabsContent>

                    </Tabs>
                </Card>

                <p className="mt-8 text-sm text-muted-foreground pb-4">
                    By continuing, you agree to UniConnect's Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
