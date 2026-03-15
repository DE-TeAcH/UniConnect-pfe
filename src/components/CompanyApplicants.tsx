import React from 'react';
import { ApplicantsPage } from './ApplicantsPage';

interface CompanyApplicantsProps { currentUser?: any; }

export function CompanyApplicants({ currentUser }: CompanyApplicantsProps) {
    return <ApplicantsPage role="company" currentUser={currentUser} />;
}
