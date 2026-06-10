"use client";

import { useState } from "react";

import StudentCalendarPanel from "./ActiveStudentsPanel";
import UnpaidLessonsPanel from "./UnpaidLessonsPanel";

type LessonDto = {
    id: number;
    lessonStartTime: string;
    durationMin: number;
    isPaid: boolean;
};

type StudentDto = {
    id: number;
    login: string | null;
    status: string;
    lessons: LessonDto[];
};

type AdminTeacherPanelProps = {
    students: StudentDto[];
    teacherTimeZone: string;
};

export default function AdminTeacherPanel({
    students,
    teacherTimeZone,
}: AdminTeacherPanelProps) {
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

    return (
        <>
            <UnpaidLessonsPanel
                students={students}
                teacherTimeZone={teacherTimeZone}
                onOpenStudent={setSelectedStudentId}
            />

            <StudentCalendarPanel
                students={students}
                teacherTimeZone={teacherTimeZone}
                selectedStudentId={selectedStudentId}
                onSelectedStudentIdChange={setSelectedStudentId}
            />
        </>
    );
}