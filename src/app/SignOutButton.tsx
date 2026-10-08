import { signOutAction } from "@/app/actions/auth";

export default function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-100"
      >
        Sign Out
      </button>
    </form>
  );
}
