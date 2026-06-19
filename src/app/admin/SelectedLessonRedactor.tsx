"use client";

import { useState } from "react";

import { updateLessonInfo, updateLessonPaidStatus } from "./actions";

type StudentForLesson = {
    id: number;
    login: string | null;
};


type SelectedLessonRedactorProps = {
    selectedStudent: StudentForLesson;
    selectedLessonId: number;
    teacherTimeZone: string;
    formatDateTime: (iso: string, timeZone: string) => string;
    addMinutesToIsoString: (startIso: string, minutes: number) => string;
    onClose: () => void;
    selectedSlotStart: string;
    isPaid: boolean;
};

export default function SelectedLessonRedactor({
    selectedStudent,
    selectedLessonId,
    teacherTimeZone,
    formatDateTime,
    addMinutesToIsoString,
    onClose,
    selectedSlotStart,
    isPaid,
}: SelectedLessonRedactorProps) {
    const [durationMin, setDurationMin] = useState(60);

    //ПОДГОТОВКА ВРЕМЕНИ НАЧАЛА 
    let beginTime = formatDateTime(selectedSlotStart, teacherTimeZone);
    let beginDate = new Date(beginTime);
    const [startDay, setStartDay] = useState(beginDate.getDay())



    return (
        
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <button
                type="button"
                aria-label="Закрыть подтверждение"
                className="absolute inset-0 bg-black/30"
                onClick={onClose}
            />

            <div className="relative z-10 w-[90%] max-w-md rounded-2xl bg-surface p-5 text-surface-foreground shadow-2xl">
                <h4 className="text-base font-semibold">Редактирование</h4>

                <p className="mt-3 text-sm">
                    Ученик:{" "}
                    <span className="font-medium">
                        {selectedStudent.login ?? `id=${selectedStudent.id}`}
                    </span>
                </p>

//TODO: ДОДЕЛАТЬ РЕДАКТИРОВАНИЕ ДНЯ, ЧАСА, МИНУТЫ + actions.ts нужно обновить 
                <p className="mt-2 text-sm">
                    <form
                    action={updateLessonInfo}
                    onSubmit={onClose}
                    className="mt-4 flex flex-wrap items-end gap-2"
                    >
                        <input type="hidden" name="startISO" value={selectedSlotStart} />
                        <label className="text-sm">
                            Начало:
                            <input
                                type="number"
                                name="startDay"
                                min="1"
                                max="31"
                                value={beginDate.getDay()}
                                onChange={(event) => setStartDay(Number(event.currentTarget.value))}
                                className="mt-1 block h-9 w-32 rounded-md border bg-surface px-3 text-sm"
                            />
                        </label>
                    </form>
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

//TODO: Добавить проверку оплаты
                <form action={updateLessonPaidStatus} className="mt-4">
                    <input type="hidden" name="lessonId" value={selectedLessonId} />

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="isPaid"
                            defaultChecked={isPaid}
                            onChange={(e) => {
                                e.currentTarget.form?.requestSubmit();
                            }}
                        />
                        Оплачено
                    </label>
                </form>

                <form
                    action={updateLessonInfo}
                    onSubmit={onClose}
                    className="mt-4 flex flex-wrap items-end gap-2"
                >
                    <input type="hidden" name="lessonId" value={selectedLessonId} />
                    <input type="hidden" name="isPaid" value={isPaid ? "true" : "false"} />
                    <input type="hidden" name="lessonStartTime" value={String(selectedSlotStart)} />

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
                        Сохранить
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
};