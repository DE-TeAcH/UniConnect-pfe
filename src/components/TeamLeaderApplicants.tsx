import React from 'react';
import { ApplicantsPage } from './ApplicantsPage';

interface TeamLeaderApplicantsProps { currentUser?: any; }

export function TeamLeaderApplicants({ currentUser }: TeamLeaderApplicantsProps) {
    return <ApplicantsPage role="team-leader" currentUser={currentUser} />;
}
