import React from 'react';
import { ApplicantsPage } from './ApplicantsPage';

interface TeacherApplicantsProps { currentUser?: any; }

export function TeacherApplicants({ currentUser }: TeacherApplicantsProps) {
    return <ApplicantsPage role="teacher" currentUser={currentUser} />;
}
