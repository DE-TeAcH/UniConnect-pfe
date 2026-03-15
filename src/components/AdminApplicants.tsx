import React from 'react';
import { ApplicantsPage } from './ApplicantsPage';

interface AdminApplicantsProps { currentUser?: any; }

export function AdminApplicants({ currentUser }: AdminApplicantsProps) {
    return <ApplicantsPage role="admin" currentUser={currentUser} />;
}
