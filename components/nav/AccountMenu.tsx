import { currentUser, demoMode } from "@/lib/auth";
import { signOutAction } from "@/lib/actions/auth-actions";

export async function AccountMenu() {
  if (demoMode()) return <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">Demo mode · data is shared</p>;
  const user = await currentUser();
  if (!user) return null;
  return (
    <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-5 py-3">
      <span className="truncate text-xs text-slate-600" title={user.email ?? undefined}>
        {user.email}
      </span>
      <form action={signOutAction}>
        <button
          type="submit"
          className="rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-600"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
