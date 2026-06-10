import Link from "next/link";

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">jabot — расписание</h1>

      <div className="mt-4 flex gap-3">
        <Link className="underline" href="/student">
          Перейти в кабинет ученика
        </Link>
        <Link className="underline" href="/admin">
          Перейти в панель учителя
        </Link>
      </div>
    </main>
  );
}