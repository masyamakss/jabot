"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window === "undefined") { return "light"; }

        const savedTheme = window.localStorage.getItem("theme");

        return savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
    });

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        window.localStorage.setItem("theme", theme);
    }, [theme]);

    function toggleTheme() {
        const nextTheme = theme === "dark" ? "light" : "dark";

        setTheme(nextTheme);
    }

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md border border-border px-3 py-2 text-sm"
        >
            {theme === "dark" ? "Светлая тема" : "Темная тема"}
        </button>
    );
}
