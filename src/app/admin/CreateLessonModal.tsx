"use client";

import { useState } from "react";

import { createLessonForStudent } from "./actions";

type StudentForLesson = {
    id: number;
    login: string | null;
};

type CreateLessonModalProps = {
    selectedStudent: StudentForLesson;
    selectedSlotStart: string;
    teacherTimeZone: string;
    formatDateTime: (iso: string, timeZone: string) => string;
    onClose: () => void;
};

function addMinutesToIsoString(startIso: string, minutes: number) {
    const start = new Date(startIso);
    const end = new Date(start.getTime() + minutes * 60 * 1000);
    return end.toISOString();
}

export default function CreateLessonModal({
    selectedStudent,
    selectedSlotStart,
    teacherTimeZone,
    formatDateTime,
    onClose,
}: CreateLessonModalProps) {
    const [durationMin, setDurationMin] = useState(60);

    return (
        <div className="fixed inset-0 z-20 flex items-center justify-center">
            <button
                type="button"
                aria-label="Закрыть подтверждение"
                className="absolute inset-0 bg-black/30"
                onClick={onClose}
            />

            <div className="relative z-10 w-[90%] max-w-md rounded-2xl bg-surface p-5 text-surface-foreground shadow-2xl">
                <h4 className="text-base font-semibold">Создать урок</h4>

                <p className="mt-3 text-sm">
                    Ученик:{" "}
                    <span className="font-medium">
                        {selectedStudent.login ?? `id=${selectedStudent.id}`}
                    </span>
                </p>

                <p className="mt-2 text-sm">
                    Начало:{" "}
                    <span className="font-medium">
                        {formatDateTime(selectedSlotStart, teacherTimeZone)}
                    </span>
                </p>

                <p className="mt-1 text-sm">
                    Конец:{" "}
                    <span className="font-medium">
                        {formatDateTime(
                            addMinutesToIsoString(selectedSlotStart, durationMin),
                            teacherTimeZone
                        )}
                    </span>
                </p>

                <form
                    action={createLessonForStudent}
                    onSubmit={onClose}
                    className="mt-4 flex flex-wrap items-end gap-2"
                >
                    <input type="hidden" name="userId" value={selectedStudent.id} />
                    <input type="hidden" name="lessonStartTime" value={selectedSlotStart} />

                    <label className="text-sm">
                        Длительность, мин
                        <input
                            type="number"
                            name="durationMin"
                            min="1"
                            value={durationMin}
                            onChange={(event) => setDurationMin(Number(event.currentTarget.value))}
                            className="mt-1 block h-9 w-32 rounded-md border bg-surface px-3 text-sm"
                        />
                    </label>

                    <button
                        type="submit"
                        className="rounded-md border px-3 py-2 text-sm"
                    >
                        Создать урок
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border px-3 py-2 text-sm"
                    >
                        Отмена
                    </button>
                </form>
            </div>
        </div>
    );
}
