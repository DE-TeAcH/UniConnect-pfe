import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './dialog';
import { Button } from './button';
import { AlertTriangle, Info, Trash2, XCircle } from 'lucide-react';

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    type?: 'danger' | 'info' | 'warning' | 'success';
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
}

export function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    type = 'info',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isLoading = false,
}: ConfirmationDialogProps) {
    const getIcon = () => {
        switch (type) {
            case 'danger':
                return <Trash2 className="h-6 w-6 text-red-600" />;
            case 'warning':
                return <AlertTriangle className="h-6 w-6 text-amber-500" />;
            case 'success':
                return <Info className="h-6 w-6 text-green-500" />;
            default:
                return <Info className="h-6 w-6 text-blue-500" />;
        }
    };

    const getButtonVariant = () => {
        switch (type) {
            case 'danger':
                return 'destructive';
            case 'success':
                return 'default';
            default:
                return 'default';
        }
    };

    const getHeaderColor = () => {
        switch (type) {
            case 'danger':
                return 'bg-red-50 dark:bg-red-950/20';
            case 'warning':
                return 'bg-amber-50 dark:bg-amber-950/20';
            case 'success':
                return 'bg-green-50 dark:bg-green-950/20';
            default:
                return 'bg-blue-50 dark:bg-blue-950/20';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
                <div className={`p-6 ${getHeaderColor()} flex items-center gap-4 border-b dark:border-white/5`}>
                    <div className="p-2 rounded-full bg-background shadow-sm border dark:border-white/10">
                        {getIcon()}
                    </div>
                    <DialogHeader className="text-left p-0">
                        <DialogTitle className="text-xl font-bold tracking-tight">{title}</DialogTitle>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    <DialogDescription className="text-base text-muted-foreground leading-relaxed">
                        {description}
                    </DialogDescription>
                </div>

                <DialogFooter className="p-6 pt-0 flex sm:justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="rounded-full px-6 hover:bg-muted font-medium"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={getButtonVariant()}
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`rounded-full px-8 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' :
                                type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' :
                                    'bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800'
                            }`}
                    >
                        {isLoading ? 'Processing...' : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
