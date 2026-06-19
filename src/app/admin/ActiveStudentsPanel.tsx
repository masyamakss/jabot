"use client";

import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import luxonPlugin from "@fullcalendar/luxon3";

import ConfirmActionForm from "./ConfirmActionForm";
import {
    blockStudent,
    deleteLessonForStudent,
    updateLessonPaidStatus,
} from "./actions";

import CreateLessonModal from "./CreateLessonModal";

import SelectedLessonRedactor from "./SelectedLessonRedactor";

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

type StudentCalendarPanelProps = {
    students: StudentDto[];
    teacherTimeZone: string;
    selectedStudentId: number | null;
    onSelectedStudentIdChange: (studentId: number | null) => void;
    scpSelectedLessonId: number | null;
    scpSetSelectedLessonId: (unpaidLessonId: number | null) => void;
};

function addMinutesToIsoString(startIso: string, minutes: number) {
    const start = new Date(startIso);
    const end = new Date(start.getTime() + minutes * 60 * 1000);
    return end.toISOString();
}

function formatDateTime(iso: string, timeZone: string) {
    return new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone,
    }).format(new Date(iso));
}

export default function StudentCalendarPanel({
    students,
    teacherTimeZone,
    selectedStudentId,
    onSelectedStudentIdChange,
    scpSetSelectedLessonId,
    scpSelectedLessonId
}: StudentCalendarPanelProps) {
    const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [lessonRedactorOpen, setlessonRedactorOpen] = useState(false);
    const [globalCalendarOpen, setGlobalCalendarOpen] = useState(false);
    const [selectedGlobalLesson, setSelectedGlobalLesson] = useState<{
        studentId: number;
        studentLogin: string | null;
        lessonId: number;
        start: string;
        durationMin: number;
        isPaid: boolean;
    } | null>(null);

    const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null;

    const selectedLesson = selectedStudent?.lessons.find((lesson) => lesson.id === scpSelectedLessonId);


    const events = !selectedStudent
        ? []
        : selectedStudent.lessons.map((lesson) => ({
            id: String(lesson.id),
            title: `${selectedStudent.login ?? `student-${selectedStudent.id}`} ${lesson.isPaid ? "✅" : "❌"}`,
            start: lesson.lessonStartTime,
            end: addMinutesToIsoString(lesson.lessonStartTime, lesson.durationMin),
            backgroundColor: lesson.isPaid ? "#166534" : "#92400e",
            borderColor: lesson.isPaid ? "#22c55e" : "#f59e0b",
            textColor: "#ffffff",
            extendedProps: {
                isPaid: lesson.isPaid,
            },
        }));

    const globalEvents = students.flatMap((student) =>
        student.lessons.map((lesson) => ({
            id: `student-${student.id}-lesson-${lesson.id}`,
            title: `${student.login ?? `student-${student.id}`} ${lesson.isPaid ? "✅" : "❌"}`,
            start: lesson.lessonStartTime,
            end: addMinutesToIsoString(lesson.lessonStartTime, lesson.durationMin),
            backgroundColor: lesson.isPaid ? "#166534" : "#92400e",
            borderColor: lesson.isPaid ? "#22c55e" : "#f59e0b",
            textColor: "#ffffff",
            extendedProps: {
                studentId: student.id,
                lessonId: lesson.id,
                isPaid: lesson.isPaid,
                studentLogin: student.login,
                durationMin: lesson.durationMin,
                startIso: lesson.lessonStartTime,
            },
        }))
    );

    function openStudentCalendar(studentId: number) {
        onSelectedStudentIdChange(studentId);
        setSelectedSlotStart(null);
    }

    function closeStudentCalendar() {
        onSelectedStudentIdChange(null);
        setSelectedSlotStart(null);
        closeDeleteLessonModal();
    }

    function closeDeleteLessonModal() {
        scpSetSelectedLessonId(null);
        setConfirmDeleteOpen(false);
    }

    function closeGlobalCalendar() {
        setGlobalCalendarOpen(false);
        setSelectedGlobalLesson(null);
    }

    return (
        <div className="mt-8">

            <h2 className="text-xl font-medium">Активные ученики</h2>

            <div className="mt-3 space-y-3">
                {students.length === 0 ? (
                    <p className="text-sm opacity-70">Нет активных учеников.</p>
                ) : (
                    students.map((student) => (
                        <div key={student.id} className="rounded-lg border p-4">
                            <button
                                type="button"
                                onClick={() => openStudentCalendar(student.id)}
                                className="block w-full text-left"
                            >
                                <p>ID: {student.id}</p>
                                <p>Логин: {student.login ?? "без логина"}</p>
                                <p>Уроков: {student.lessons.length}</p>
                            </button>

                            <div className="mt-3">
                                <ConfirmActionForm
                                    action={blockStudent}
                                    userId={student.id}
                                    userLogin={student.login}
                                    buttonText="Заблокировать"
                                    confirmText="Заблокировать ученика"
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4">
                <button
                    type="button"
                    onClick={() => setGlobalCalendarOpen(true)}
                    className="rounded-md border px-3 py-2 text-sm"
                >
                    Показать общий календарь
                </button>
            </div>

            {selectedStudent && (
                <div className="fixed inset-0 z-50">
                    <button
                        type="button"
                        aria-label="Закрыть окно"
                        className="absolute inset-0 z-0 bg-black/40"
                        onClick={closeStudentCalendar}
                    />

                    <div className="absolute inset-x-0 bottom-0 z-10 max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 bg-surface text-surface-foreground shadow-2xl md:inset-x-4 md:bottom-4 md:mx-auto md:max-w-6xl md:rounded-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    Календарь ученика:{" "}
                                    {selectedStudent.login ?? `id=${selectedStudent.id}`}
                                </h3>
                                <p className="mt-1 text-sm opacity-70">
                                    Уроков: {selectedStudent.lessons.length}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeStudentCalendar}
                                className="rounded-md border px-3 py-2 text-sm"
                            >
                                Закрыть
                            </button>
                        </div>

                        {selectedSlotStart && (
                            <CreateLessonModal
                                selectedStudent={selectedStudent}
                                selectedSlotStart={selectedSlotStart}
                                teacherTimeZone={teacherTimeZone}
                                formatDateTime={formatDateTime}
                                onClose={() => setSelectedSlotStart(null)} />
                        )}
                        <div className="mt-4 rounded-lg border bg-white p-2 text-slate-900 opacity-100">
                            <FullCalendar
                                plugins={[luxonPlugin, dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="timeGridWeek"
                                height="auto"
                                events={events}
                                headerToolbar={{
                                    left: "prev,next today",
                                    center: "title",
                                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                                }}
                                eventClick={(info) => {
                                    scpSetSelectedLessonId(Number(info.event.id));
                                }}
                                dateClick={(info) => {
                                    if (info.allDay) {
                                        alert("Пока создаём уроки только по времени в week/day view.");
                                        return;
                                    }

                                    setSelectedSlotStart(info.dateStr);
                                }}
                                timeZone={teacherTimeZone}
                            />
                        </div>
                        {selectedLesson && (
                            <div className="fixed inset-0 z-30 flex items-center justify-center">
                                <button
                                    type="button"
                                    aria-label="Закрыть удаление урока"
                                    className="absolute inset-0 bg-black/30"
                                    onClick={closeDeleteLessonModal}
                                />

                                <div className="relative z-10 w-[90%] max-w-md rounded-2xl p-5 bg-surface text-surface-foreground shadow-2xl">
                                    <h4 className="text-base font-semibold">Удалить урок</h4>

                                    <p className="mt-3 text-sm">
                                        Вы уверены, что хотите удалить урок{" "}
                                        <span className="font-medium">
                                            {selectedStudent.login ?? `id=${selectedLesson.id}`}
                                        </span>
                                        ?
                                    </p>

                                    <p className="mt-2 text-sm">
                                        Начало:{" "}
                                        <span className="font-medium">
                                            {formatDateTime(selectedLesson.lessonStartTime, teacherTimeZone)}
                                        </span>
                                    </p>

                                    <form action={updateLessonPaidStatus} className="mt-4">
                                        <input type="hidden" name="lessonId" value={selectedLesson.id} />
                            
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                name="isPaid"
                                                defaultChecked={selectedLesson.isPaid}
                                                onChange={(e) => {
                                                    e.currentTarget.form?.requestSubmit();
                                                }}
                                            />
                                            Оплачено
                                        </label>
                                    </form>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDeleteOpen(true)}
                                            className="rounded-md border px-3 py-2 text-sm"
                                        >
                                            Удалить урок
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setlessonRedactorOpen(true)}
                                            className="rounded-md border px-3 py-2 text-sm"
                                        >
                                            Редактировать
                                        </button>

                                        <button
                                            type="button"
                                            onClick={closeDeleteLessonModal}
                                            className="rounded-md border px-3 py-2 text-sm"
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {selectedLesson && lessonRedactorOpen && (
                            <SelectedLessonRedactor
                                selectedStudent={selectedStudent}
                                selectedLessonId={selectedLesson.id}
                                teacherTimeZone={teacherTimeZone}
                                formatDateTime={formatDateTime}
                                addMinutesToIsoString={addMinutesToIsoString}
                                onClose={() => setlessonRedactorOpen(false)}
                                selectedSlotStart={selectedLesson.lessonStartTime}
                                isPaid={selectedLesson.isPaid} />
                        )}
                        {confirmDeleteOpen && selectedLesson && (
                            <div className="fixed inset-0 z-40 flex items-center justify-center">
                                <button
                                    type="button"
                                    aria-label="Закрыть подтверждение удаления"
                                    className="absolute inset-0 bg-black/30"
                                    onClick={() => setConfirmDeleteOpen(false)}
                                />

                                <div className="relative z-10 w-[90%] max-w-md rounded-2xl p-5 bg-surface text-surface-foreground shadow-2xl">
                                    <h4 className="text-base font-semibold">Подтвердить удаление</h4>

                                    <p className="mt-3 text-sm">
                                        Вы уверены, что хотите удалить урок{" "}
                                        <span className="font-medium">
                                            {selectedStudent.login ?? `id=${selectedLesson.id}`}
                                        </span>
                                        ?
                                    </p>

                                    {selectedLesson.lessonStartTime && (
                                        <p className="mt-2 text-sm">
                                            Начало:{" "}
                                            <span className="font-medium">
                                                {formatDateTime(selectedLesson.lessonStartTime, teacherTimeZone)}
                                            </span>
                                        </p>
                                    )}

                                    <form
                                        action={deleteLessonForStudent}
                                        onSubmit={() => {
                                            setConfirmDeleteOpen(false);
                                            closeDeleteLessonModal();
                                        }}
                                        className="mt-4 flex flex-wrap gap-2"
                                    >
                                        <input type="hidden" name="lessonId" value={selectedLesson.id} />

                                        <button
                                            type="submit"
                                            className="rounded-md border px-3 py-2 text-sm"
                                        >
                                            Подтвердить удаление
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setConfirmDeleteOpen(false)}
                                            className="rounded-md border px-3 py-2 text-sm"
                                        >
                                            Назад
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {globalCalendarOpen && (
                <div className="fixed inset-0 z-40">
                    <button
                        type="button"
                        aria-label="Закрыть общий календарь"
                        className="absolute inset-0 bg-black/40"
                        onClick={() => closeGlobalCalendar()}
                    />

                    <div className="absolute inset-x-0 bottom-0 z-10 max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 bg-surface text-surface-foreground shadow-2xl md:inset-x-4 md:bottom-4 md:mx-auto md:max-w-6xl md:rounded-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold">Общий календарь</h3>
                                <p className="mt-1 text-sm opacity-70">
                                    Все занятия активных учеников
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => closeGlobalCalendar()}
                                className="rounded-md border px-3 py-2 text-sm"
                            >
                                Закрыть
                            </button>
                        </div>

                        {selectedGlobalLesson && (
                            <div className="mt-4 rounded-lg border p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h4 className="text-base font-semibold">
                                            {selectedGlobalLesson.studentLogin ?? `student-${selectedGlobalLesson.studentId}`}
                                        </h4>

                                        <p className="mt-2 text-sm">
                                            Начало: {""}
                                            <span className="font-medium">
                                                {formatDateTime(selectedGlobalLesson.start, teacherTimeZone)}
                                            </span>
                                        </p>

                                        <p className="mt-1 text-sm">
                                            Конец:{" "}
                                            <span className="font-medium">
                                                {formatDateTime(
                                                    addMinutesToIsoString(
                                                        selectedGlobalLesson.start,
                                                        selectedGlobalLesson.durationMin
                                                    ),
                                                    teacherTimeZone
                                                )}
                                            </span>
                                        </p>

                                        <p className="mt-1 text-sm">
                                            Длительность: {selectedGlobalLesson.durationMin} мин
                                        </p>

                                        <p className="mt-1 text-sm">
                                            Оплачено: {selectedGlobalLesson.isPaid ? "да" : "нет"}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-start gap-2 md:items-end">
                                        <button type="button" onClick={() => setSelectedGlobalLesson(null)}
                                            className="mt-3 mr-3 rounded-md border px-3 py-2 text-sm">
                                            Закрыть карточку занятия
                                        </button>

                                        <button type="button" onClick={() => {
                                            openStudentCalendar(selectedGlobalLesson.studentId);
                                            closeGlobalCalendar();
                                            setSelectedGlobalLesson(null);
                                        }} className="mt-3 rounded-md border px-3 py-2 text-sm">
                                            Открыть календарь ученика
                                        </button>
                                    </div>
                                </div>
                            </div>

                        )}

                        <div className="mt-4 rounded-lg border bg-white p-2 text-slate-900">
                            <FullCalendar
                                plugins={[luxonPlugin, dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                height="auto"
                                events={globalEvents}
                                slotLabelFormat={{
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                }}
                                headerToolbar={{
                                    left: "prev,next today",
                                    center: "title",
                                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                                }}
                                timeZone={teacherTimeZone}
                                eventClick={(info) => {
                                    setSelectedGlobalLesson({
                                        studentId: Number(info.event.extendedProps.studentId),
                                        studentLogin: info.event.extendedProps.studentLogin ?? null,
                                        lessonId: Number(info.event.extendedProps.lessonId),
                                        start: String(info.event.extendedProps.startIso),
                                        durationMin: Number(info.event.extendedProps.durationMin),
                                        isPaid: Boolean(info.event.extendedProps.isPaid),
                                    });
                                }}
                            />
                        </div>


                    </div>
                </div>
            )}
        </div>
    );
}