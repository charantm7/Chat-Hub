export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-5xl font-bold text-yellow-500">Oops!</h1>
        <h2 className="text-2xl font-semibold">Something went wrong</h2>
        <p className="text-zinc-400">An unexpected error occurred. Please try again later.</p>

        <div className="flex gap-4 justify-center mt-6">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 transition"
          >
            Retry
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
