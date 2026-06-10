"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserStatus } from "@/generated/prisma/enums";
import { Role } from "@/generated/prisma/enums";

function getUserIdFromFormData(formData: FormData): number {
    const userIdValue = formData.get("userId");

    if (!userIdValue) {
        throw new Error("Не передан userId");
    }

    const userId = Number(userIdValue);

    if (Number.isNaN(userId)) {
        throw new Error("Некорректный userId");
    }

    return userId;
}

async function updateStudentStatus(userId: number, nextStatus: UserStatus) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
            status: true,
            login: true,
        },
    });

    if (!user) {
        throw new Error("Пользователь не найден");
    }

    if (user.role !== Role.STUDENT) {
        throw new Error("Нельзя менять статус не-ученика");
    }

    if (user.status === nextStatus) {
        throw new Error("У пользователя уже такой статус");
    }

    if (user.status === UserStatus.BLOCKED && nextStatus === UserStatus.REJECTED) {
        throw new Error("Нельзя переводить BLOCKED в REJECTED");
    }

    await prisma.user.update({
        where: { id: userId },
        data: { status: nextStatus },
    });

    revalidatePath("/admin");
    revalidatePath("/student");
}

export async function approveStudent(formData: FormData) {
    const userId = getUserIdFromFormData(formData);
    await updateStudentStatus(userId, UserStatus.ACTIVE);
}

export async function rejectStudent(formData: FormData) {
    const userId = getUserIdFromFormData(formData);
    await updateStudentStatus(userId, UserStatus.REJECTED);
}

export async function blockStudent(formData: FormData) {
    const userId = getUserIdFromFormData(formData);
    await updateStudentStatus(userId, UserStatus.BLOCKED);
}

function getLessonStartFromFormData(formData: FormData): Date {
    const lessonStartValue = formData.get("lessonStartTime");

    if (typeof lessonStartValue !== "string" || lessonStartValue.length === 0) {
        throw new Error("Не передано время начала урока");
    }

    const lessonStartTime = new Date(lessonStartValue);

    if (Number.isNaN(lessonStartTime.getTime())) {
        throw new Error("Некорректное время начала урока");
    }

    return lessonStartTime;
}

function getDurationMinFromFormData(formData: FormData): number {
    const durationValue = formData.get("durationMin");

    if (typeof durationValue !== "string" || durationValue.length === 0) {
        throw new Error("Не передана длительность урока");
    }

    const durationMin = Number(durationValue);

    if (!Number.isInteger(durationMin) || durationMin <= 0) {
        throw new Error("Некорректная длительность урока");
    }

    return durationMin;
}

export async function createLessonForStudent(formData: FormData) {
    const userId = getUserIdFromFormData(formData);
    const lessonStartTime = getLessonStartFromFormData(formData);
    const durationMin = getDurationMinFromFormData(formData);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
            status: true,
            login: true,
        },
    });

    if (!user) {
        throw new Error("Пользователь не найден");
    }

    if (user.role !== Role.STUDENT) {
        throw new Error("Нельзя создавать урок не-ученику");
    }

    if (user.status !== UserStatus.ACTIVE) {
        throw new Error("Можно создавать уроки только активному ученику");
    }

    await prisma.lesson.create({
        data: {
            studentId: userId,
            lessonStartTime,
            durationMin,
            isPaid: false,
        },
    });

    revalidatePath("/admin");
    revalidatePath("/student");
}

function getLessonIdFromFormData(formData: FormData): number {
    const lessonIdValue = formData.get("lessonId");

    if (!lessonIdValue) {
        throw new Error("Не передан lessonId");
    }

    const lessonId = Number(lessonIdValue);

    if (Number.isNaN(lessonId)) {
        throw new Error("Некорректный lessonId");
    }

    return lessonId;
}

export async function deleteLessonForStudent(formData: FormData) {
    const lessonId = getLessonIdFromFormData(formData);

    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: {
            id: true,
            student: {
                select: {
                    id: true,
                    role: true,
                },
            },
        },
    });

    if (!lesson) {
        throw new Error("Урок не найден");
    }

    if (lesson.student.role !== Role.STUDENT) {
        throw new Error("Нельзя удалять урок не-ученика");
    }

    await prisma.lesson.delete({
        where: { id: lessonId },
    });

    revalidatePath("/admin");
    revalidatePath("/student");
}

export async function updateLessonPaidStatus(formData: FormData) {
    const lessonId = getLessonIdFromFormData(formData);

    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: {
            id: true,
            student: {
                select: {
                    role: true,
                    status: true,
                },
            },
        },
    });

    if (!lesson) {
        throw new Error("Урок не найден");
    }

    if (lesson.student.role !== Role.STUDENT) {
        throw new Error("Нельзя менять оплату урока не-ученика");
    }

    if (lesson.student.status !== UserStatus.ACTIVE) {
        throw new Error("Можно менять оплату только у урока активного ученика");
    }

    const isPaid = formData.get("isPaid") !== null;

    await prisma.lesson.update({
        where: { id: lessonId },
        data: { isPaid },
    });

    revalidatePath("/admin");
    revalidatePath("/student");
}

export async function updateTeacherTimeZone(formData: FormData) {
    const teacherIdValue = formData.get("teacherId");
    const timeZoneValue = formData.get("timeZone");

    if (!teacherIdValue || typeof timeZoneValue !== "string") {
        throw new Error("Не передан часовой пояс");
    }

    const teacherId = Number(teacherIdValue);

    if (Number.isNaN(teacherId)) {
        throw new Error("Некорректный teacherId");
    }

    await prisma.user.update({
        where: { id: teacherId },
        data: { timeZone: timeZoneValue },
    });

    revalidatePath("/admin");
}
