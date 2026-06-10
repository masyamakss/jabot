import { prisma } from "@/lib/prisma";

export default async function StudentPage() {
    const student = await prisma.user.findFirst({
        where: {
            role: "STUDENT",
        },
        include: {
            lessons: {
                orderBy: {
                    lessonStartTime: "asc",
                },
            },
        },
    });

    if (!student) {
        return (
            <main className="p-6">
                <h1 className="text-2xl font-semibold">Кабинет ученика</h1>
                <p className="mt-2">В базе пока нет ни одного ученика.</p>
            </main>
        );
    }

    if (student.status === "PENDING") {
        return (
            <main className="p-6">
                <h1 className="text-2xl font-semibold">Кабинет ученика</h1>
                <p className="mt-2">Ваш доступ ещё не подтверждён преподавателем.</p>
            </main>
        );
    }

    if (student.status === "REJECTED") {
        return (
            <main className="p-6">
                <h1 className="text-2xl font-semibold">Кабинет ученика</h1>
                <p className="mt-2">Заявка отклонена.</p>
            </main>
        );
    }

    if (student.status === "BLOCKED") {
        return (
            <main className="p-6">
                <h1 className="text-2xl font-semibold">Кабинет ученика</h1>
                <p className="mt-2">Доступ заблокирован.</p>
            </main>
        );
    }

    return (
        <main className="p-6">
            <h1 className="text-2xl font-semibold">Кабинет ученика</h1>

            <p className="mt-2 text-sm opacity-80">
                Логин: {student.login ?? "без логина"}
            </p>

            <div className="mt-6 space-y-4">
                {student.lessons.map((lesson) => (
                    <div key={lesson.id} className="rounded-lg border p-4">
                        <p>Начало: {lesson.lessonStartTime.toLocaleString("ru-RU")}</p>
                        <p>Длительность: {lesson.durationMin} минут</p>
                        <p>Оплачено: {lesson.isPaid ? "Да" : "Нет"}</p>
                    </div>
                ))}
            </div>
        </main>
    );
}