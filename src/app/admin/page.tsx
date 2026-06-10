import { prisma } from "@/lib/prisma";
import ConfirmActionForm from "./ConfirmActionForm";
import {
    approveStudent, rejectStudent, blockStudent, updateTeacherTimeZone
} from "./actions";
import AdminTeacherPanel from "./AdminTeacherPanel"
import ThemeToggle from "../ThemeToggle"


export default async function AdminPage() {
    const users = await prisma.user.findMany({
        where: {
            role: "STUDENT",
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            lessons: {
                orderBy: {
                    lessonStartTime: "asc",
                },
            },
        },
    });

    const teacher = await prisma.user.findFirst({
        where: { role: "TEACHER", },
    });
    if (!teacher) {
        return (
            <main className="p-6">
                <h1 className="text-2xl font-semibold">Панель преподавателя</h1>
                <p className="mt-2">В базе пока нет преподавателя.</p>
            </main>
        );
    }

    const pendingUsers = users.filter((user) => user.status === "PENDING");
    const activeUsers = users.filter((user) => user.status === "ACTIVE");
    const rejectedUsers = users.filter((user) => user.status === "REJECTED");
    const blockedUsers = users.filter((user) => user.status === "BLOCKED");
    const activeStudentsForCalendar = activeUsers.map((user) => ({
        id: user.id,
        login: user.login,
        status: user.status,
        lessons: user.lessons.map((lesson) => ({
            id: lesson.id,
            lessonStartTime: lesson.lessonStartTime.toISOString(),
            durationMin: lesson.durationMin,
            isPaid: lesson.isPaid,
        })),
    }));

    let nextLesson = null;

    for (const user of activeUsers) {
        for (const lesson of user.lessons) {
            if (lesson.lessonStartTime > new Date()) {
                if (nextLesson === null || lesson.lessonStartTime < nextLesson.lessonStartTime) {
                    nextLesson = {
                        studentLogin: user.login,
                        studentId: user.id,
                        lessonStartTime: lesson.lessonStartTime,
                    }
                }
            }
        }
    }

    const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: teacher.timeZone,
    });

    return (
        <main className="min-h-screen bg-background px-4 py-6 text-foreground">
            <div className="mx-auto w-full max-w-6xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Панель учителя (админ)
                        </h1>
                    </div>

                    <ThemeToggle />
                </div>

                <form action={updateTeacherTimeZone} className="mt-4 flex items-center gap-2">
                    <input type="hidden" name="teacherId" value={teacher.id} />

                    <select
                        key={teacher.timeZone}
                        name="timeZone"
                        defaultValue={teacher.timeZone}
                        className="h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="Europe/Moscow">Москва</option>
                        <option value="Asia/Tokyo">Токио</option>
                    </select>

                    <button
                        type="submit"
                        className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm"
                    >
                        Сохранить
                    </button>

                </form>

                <section className="mt-6">
                    <h2 className="text-xl font-medium">Ближайшее занятие</h2>

                    <div className="mt-3 inline-block rounded-lg border bg-surface p-4 text-surface-foreground">
                        {nextLesson ? (
                            <>
                                <p className="mt-2 font-medium">
                                    {nextLesson.studentLogin ?? `student-${nextLesson.studentId}`}
                                </p>
                                <p className="mt-1 text-sm opacity-70">
                                    {dateTimeFormatter.format(nextLesson.lessonStartTime)}
                                </p>
                            </>
                        ) : (
                            <p className="mt-2 text-sm opacity-70">Нет ближайших уроков</p>
                        )}
                    </div>
                </section>

                <section className="mt-6">
                    <h2 className="text-xl font-medium">Ожидают подтверждения</h2>
                    <div className="mt-3 space-y-3">
                        {pendingUsers.map((user) => (
                            <div key={user.id} className="mt-3 rounded-lg border p-4">
                                <p>ID: {user.id}</p>
                                <p>Логин: {user.login ?? "без логина"}</p>
                                <p>Статус: {user.status}</p>

                                <div className="mt-3 flex gap-2">
                                    <ConfirmActionForm
                                        action={approveStudent}
                                        userId={user.id}
                                        userLogin={user.login}
                                        buttonText="Подтвердить"
                                        confirmText="Подтвердить ученика"
                                    />

                                    <ConfirmActionForm
                                        action={rejectStudent}
                                        userId={user.id}
                                        userLogin={user.login}
                                        buttonText="Отклонить"
                                        confirmText="Отклонить ученика"
                                    />

                                    <ConfirmActionForm
                                        action={blockStudent}
                                        userId={user.id}
                                        userLogin={user.login}
                                        buttonText="Заблокировать"
                                        confirmText="Заблокировать ученика"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <AdminTeacherPanel
                    students={activeStudentsForCalendar}
                    teacherTimeZone={teacher.timeZone}
                />

                <section className="mt-8">
                    <h2 className="text-xl font-medium">Отклонённые</h2>
                    <div className="mt-3 space-y-3">
                        {rejectedUsers.length === 0 ? (
                            <p className="text-sm opacity-70">Нет отклонённых пользователей.</p>
                        ) : (
                            rejectedUsers.map((user) => (
                                <div key={user.id} className="rounded-lg border p-4">
                                    <p>ID: {user.id}</p>
                                    <p>Логин: {user.login ?? "без логина"}</p>
                                    <p>Telegram ID: {user.telegramId ?? "нет"}</p>
                                    <p>Роль: {user.role}</p>
                                    <p>Статус: {user.status}</p>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="mt-8">
                    <h2 className="text-xl font-medium">Заблокированные</h2>
                    <div className="mt-3 space-y-3">
                        {blockedUsers.length === 0 ? (
                            <p className="text-sm opacity-70">Нет заблокированных пользователей.</p>
                        ) : (
                            blockedUsers.map((user) => (
                                <div key={user.id} className="rounded-lg border p-4">
                                    <p>ID: {user.id}</p>
                                    <p>Логин: {user.login ?? "без логина"}</p>
                                    <p>Telegram ID: {user.telegramId ?? "нет"}</p>
                                    <p>Роль: {user.role}</p>
                                    <p>Статус: {user.status}</p>
                                    <ConfirmActionForm
                                        action={approveStudent}
                                        userId={user.id}
                                        userLogin={user.login}
                                        buttonText="Разблокировать"
                                        confirmText="Разблокировать ученика"
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}