"use client";

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

type UnpaidLessonsPanelProps = {
    students: StudentDto[];
    teacherTimeZone: string;
    onOpenStudent: (studentId: number) => void;
    onSelectUnpaidLesson: (unpaidLessonId: number) => void;
};

function formatDateTime(iso: string, timeZone: string) {
    return new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone,
    }).format(new Date(iso));
};

export default function UnpaidLessonsPanel({
    students,
    teacherTimeZone,
    onOpenStudent,
    onSelectUnpaidLesson,
}: UnpaidLessonsPanelProps) {
    const now = new Date();

    const unpaidLessons = students
        .flatMap((student) =>
            student.lessons
                .filter((lesson) => !lesson.isPaid)
                .map((lesson) => ({
                    lessonId: lesson.id,
                    studentId: student.id,
                    studentLogin: student.login,
                    lessonStartTime: lesson.lessonStartTime,
                    durationMin: lesson.durationMin,
                    isPast: new Date(lesson.lessonStartTime) < now,
                }))
        )
        .sort(
            (a, b) =>
                new Date(a.lessonStartTime).getTime() -
                new Date(b.lessonStartTime).getTime()
        );


    return (
        <section className="mt-6">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h2 className="text-xl font-medium">Неоплаченные уроки</h2>
                    <p className="mt-1 text-sm opacity-70">
                        Всего: {unpaidLessons.length}
                    </p>
                </div>
            </div>

            {unpaidLessons.length === 0 ? (
                <p className="mt-3 text-sm opacity-70">
                    Неоплаченных уроков нет.
                </p>
            ) : (
                <div className="mt-3 flex gap-3 overflow-x-auto pb-3">
                    {unpaidLessons.map((lesson) => (
                        <button
                            key={lesson.lessonId}
                            type="button"
                            onClick={() => { onOpenStudent(lesson.studentId); onSelectUnpaidLesson(lesson.lessonId) }}
                            className="min-w-[260px] rounded-lg border bg-surface p-4 text-surface-foreground"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-medium">
                                        {lesson.studentLogin ?? `student-${lesson.studentId}`}
                                    </p>

                                    <p className="mt-1 text-sm opacity-70">
                                        {formatDateTime(
                                            lesson.lessonStartTime,
                                            teacherTimeZone
                                        )}
                                    </p>
                                </div>

                                <span className="rounded-full border px-2 py-1 text-xs">
                                    {lesson.isPast ? "Прошел" : "Будет"}
                                </span>
                            </div>

                            <p className="mt-3 text-sm">
                                Длительность: {lesson.durationMin} мин
                            </p>
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
