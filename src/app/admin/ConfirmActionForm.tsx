"use client";

type ConfirmActionFormProps = {
    action: (formData: FormData) => void | Promise<void>;
    userId: number;
    userLogin: string | null;
    buttonText: string;
    confirmText: string;
};

export default function ConfirmActionForm({
    action,
    userId,
    userLogin,
    buttonText,
    confirmText,
}: ConfirmActionFormProps) {
    return (
        <form
            action={action}
            className="mt-3"
            onSubmit={(e) => {
                const ok = window.confirm(
                    `${confirmText} ${userLogin ?? `id=${userId}`}?`
                );

                if (!ok) {
                    e.preventDefault();
                }
            }}
        >
            <input type="hidden" name="userId" value={userId} />
            <button
                type="submit"
                className="rounded-md border px-3 py-2 text-sm"
            >
                {buttonText}
            </button>
        </form>
    );
}