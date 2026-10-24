import { connection } from "next/server";

import { auth, signIn, signOut } from "@/lib/auth";

/**
 * Server-only auth control. Reads the session with `auth()` and renders either
 * a GitHub sign-in button or the current user's identity plus a sign-out
 * button. Both buttons submit a `<form>` whose action is an inline Server
 * Action that calls Auth.js `signIn`/`signOut`, the supported pattern for
 * Auth.js v5 on Next.js 16.
 */
export async function AuthButton() {
  // Opt into dynamic rendering so the request-dependent session read (which
  // triggers crypto.getRandomValues()) runs at request time, not during
  // prerendering. The <Suspense> wrapper in the root layout streams this
  // subtree, mirroring the `await connection()` pattern in favorites/page.tsx.
  await connection();
  const session = await auth();

  if (!session?.user) {
    return (
      <form
        action={async () => {
          "use server";
          await signIn("github");
        }}
      >
        <button
          type="submit"
          className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-canvas transition-opacity hover:opacity-85"
        >
          Iniciar sesión con GitHub
        </button>
      </form>
    );
  }

  const { name, image } = session.user;

  return (
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name ? `Avatar de ${name}` : "Avatar del usuario"}
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 rounded-full"
          />
        )}
        {name && (
          <span className="hidden max-w-[10rem] truncate text-sm text-muted sm:inline">
            {name}
          </span>
        )}
      </div>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button
          type="submit"
          className="rounded-md border border-rule px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
