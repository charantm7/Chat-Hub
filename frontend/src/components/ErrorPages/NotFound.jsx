export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-6xl font-bold text-purple-500">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-zinc-400">The page you are looking for doesn’t exist or was moved.</p>

        <button
          onClick={() => window.history.back()}
          className="mt-6 px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
