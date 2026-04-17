import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-[32px] bg-slate-800/50 border border-slate-700 p-10 text-center shadow-xl backdrop-blur">
        <h1 className="text-4xl font-semibold text-white">Unauthorized</h1>
        <p className="mt-4 text-slate-400">You do not have permission to access this page. Please return to your dashboard or login with the correct account.</p>
        <Link
          to="/login"
          className="mt-8 inline-flex rounded-3xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Go To Login
        </Link>
      </div>
    </div>
  );
}
