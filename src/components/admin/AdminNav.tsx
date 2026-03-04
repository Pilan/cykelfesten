import Link from 'next/link';

export default function AdminNav() {
  return (
    <nav className="bg-white border-b border-gray-200 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-bold text-green-700 text-lg">
            🚴 Cykelfesten
          </Link>
          <Link href="/admin/events" className="text-sm text-gray-600 hover:text-gray-900">
            Event
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
            Publik sida ↗
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100"
            >
              Logga ut
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
