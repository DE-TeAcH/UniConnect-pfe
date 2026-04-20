import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../services/api';

export type PublicRole = 'student' | 'teacher' | 'company' | 'team-leader' | 'admin';

export interface PublicUser {
    id: string | number;
    name: string;
    email?: string;
    role: PublicRole;
    username?: string;
    manage?: boolean | number;
    affiliation?: string;
}

export type PublicView = 'dashboard' | 'events' | 'creators' | 'history' | 'settings' | 'creator-profile';

interface PublicStoreContextType {
    user: PublicUser | null;
    login: (user: PublicUser) => void;
    logout: () => void;
    hasGuestAccess: boolean;
    continueAsGuest: () => void;
    clearGuestAccess: () => void;
    currentView: PublicView;
    currentEntityId: string | number | null;
    navigateTo: (view: PublicView, entityId?: string | number) => void;
    appliedEventIds: (string | number)[];
    applyToEvent: (eventId: string | number) => void;
    savedEventIds: (string | number)[];
    saveEvent: (eventId: string | number) => void;
    unsaveEvent: (eventId: string | number) => void;
    followedCreatorIds: (string | number)[];
    followCreator: (creatorId: string | number) => void;
    unfollowCreator: (creatorId: string | number) => void;
    requireLogin: (action: () => void) => void;
}

const PublicStoreContext = createContext<PublicStoreContextType | undefined>(undefined);

export function PublicStoreProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<PublicUser | null>(null);
    const [loginTimestamp, setLoginTimestamp] = useState<number | null>(null);
    const [appliedEventIds, setAppliedEventIds] = useState<(string | number)[]>([]);
    const [savedEventIds, setSavedEventIds] = useState<(string | number)[]>([]);
    const [followedCreatorIds, setFollowedCreatorIds] = useState<(string | number)[]>([]);

    const [hasGuestAccess, setHasGuestAccess] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('public_store');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.user) setUser(parsed.user);
                if (parsed.loginTimestamp) setLoginTimestamp(parsed.loginTimestamp);
                if (parsed.hasGuestAccess) setHasGuestAccess(parsed.hasGuestAccess);
            } catch (e) { }
        }
    }, []);

    // Fetch user associations from backend
    useEffect(() => {
        const fetchUserData = async () => {
            if (user && user.id) {
                try {
                    const [regs, favs, follows] = await Promise.all([
                        api.eventRegistrations.get({ user_id: String(user.id) }),
                        api.favorites.get({ user_id: String(user.id) }),
                        api.follows.get({ follower_id: String(user.id) })
                    ]);

                    if (regs.success && Array.isArray(regs.data)) {
                        setAppliedEventIds(regs.data.map((r: any) => r.event_id));
                    }
                    if (favs.success && Array.isArray(favs.data)) {
                        setSavedEventIds(favs.data.map((f: any) => f.event_id));
                    }
                    if (follows.success && Array.isArray(follows.data)) {
                        setFollowedCreatorIds(follows.data.map((f: any) => f.creator_id));
                    }
                } catch (err) {
                    console.error('Failed to fetch user data', err);
                }
            }
        };
        fetchUserData();
    }, [user]);

    // Session timeout check
    useEffect(() => {
        const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
        const checkSession = () => {
            if (user && loginTimestamp) {
                const now = Date.now();
                if (now - loginTimestamp > SESSION_TIMEOUT) {
                    logout();
                    toast.info('Session expired. Please log in again.');
                }
            }
        };

        checkSession();
        const interval = setInterval(checkSession, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [user, loginTimestamp]);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem('public_store', JSON.stringify({
            user, loginTimestamp, hasGuestAccess
        }));
    }, [user, loginTimestamp, hasGuestAccess]);

    const login = (newUser: PublicUser) => {
        setUser(newUser);
        setLoginTimestamp(Date.now());
        setHasGuestAccess(false);
    };

    const logout = () => {
        setUser(null);
        setLoginTimestamp(null);
        setHasGuestAccess(false);
        setAppliedEventIds([]);
        setSavedEventIds([]);
        setFollowedCreatorIds([]);
    };

    const continueAsGuest = () => {
        setHasGuestAccess(true);
    };

    const clearGuestAccess = () => {
        setHasGuestAccess(false);
    };

    const applyToEvent = async (eventId: string | number) => {
        if (!appliedEventIds.includes(eventId)) {
            try {
                if (user) await api.eventRegistrations.create({ event_id: String(eventId), user_id: String(user.id) });
                setAppliedEventIds([...appliedEventIds, eventId]);
            } catch (err) { 
                console.error('Failed to apply to event', err); 
                throw err; 
            }
        }
    };

    const saveEvent = async (eventId: string | number) => {
        if (!savedEventIds.includes(eventId)) {
            try {
                if (user) await api.favorites.toggle({ event_id: String(eventId), user_id: String(user.id) });
                setSavedEventIds([...savedEventIds, eventId]);
            } catch (err) { 
                console.error('Failed to save event', err); 
                throw err;
            }
        }
    };

    const unsaveEvent = async (eventId: string | number) => {
        try {
            if (user) await api.favorites.toggle({ event_id: String(eventId), user_id: String(user.id) });
            setSavedEventIds(savedEventIds.filter(id => id !== eventId));
        } catch (err) { 
            console.error('Failed to unsave event', err); 
            throw err;
        }
    };

    const followCreator = async (creatorId: string | number) => {
        if (!followedCreatorIds.includes(creatorId)) {
            try {
                if (user) await api.follows.toggle({ creator_id: String(creatorId), follower_id: String(user.id) });
                setFollowedCreatorIds([...followedCreatorIds, creatorId]);
            } catch (err) { 
                console.error('Failed to follow creator', err); 
                throw err;
            }
        }
    };

    const unfollowCreator = async (creatorId: string | number) => {
        try {
            if (user) await api.follows.toggle({ creator_id: String(creatorId), follower_id: String(user.id) });
            setFollowedCreatorIds(followedCreatorIds.filter(id => id !== creatorId));
        } catch (err) { 
            console.error('Failed to unfollow creator', err); 
            throw err;
        }
    };

    const [currentView, setCurrentView] = useState<PublicView>('dashboard');
    const [currentEntityId, setCurrentEntityId] = useState<string | number | null>(null);

    const navigateTo = (view: PublicView, entityId?: string | number) => {
        setCurrentView(view);
        setCurrentEntityId(entityId || null);
    };

    const requireLogin = (action: () => void) => {
        if (user) {
            action();
        } else {
            toast.info('Please log in to continue.');
            setHasGuestAccess(false);
            window.location.href = '/?page=auth';
        }
    };

    return (
        <PublicStoreContext.Provider value={{
            user, login, logout,
            hasGuestAccess, continueAsGuest, clearGuestAccess,
            currentView, currentEntityId, navigateTo,
            appliedEventIds, applyToEvent,
            savedEventIds, saveEvent, unsaveEvent,
            followedCreatorIds, followCreator, unfollowCreator,
            requireLogin
        }}>
            {children}
        </PublicStoreContext.Provider>
    );
}

export function usePublicStore() {
    const context = useContext(PublicStoreContext);
    if (!context) {
        throw new Error('usePublicStore must be used within PublicStoreProvider');
    }
    return context;
}

