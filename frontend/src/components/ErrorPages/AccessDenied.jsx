export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-5xl font-bold text-red-500">403</h1>
        <h2 className="text-2xl font-semibold">Access Denied</h2>
        <p className="text-zinc-400">You don’t have permission to access this page.</p>

        <button
          onClick={() => (window.location.href = "/")}
          className="mt-6 px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
