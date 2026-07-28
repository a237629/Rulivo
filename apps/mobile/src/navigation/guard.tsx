import { usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { useSession } from "../auth/session";
import { resolveNavigation } from "./policy";

export function NavigationGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    const decision = resolveNavigation(pathname, session);
    if (decision.returnTo !== undefined) session.setPendingPath(decision.returnTo);
    if (decision.path !== pathname) router.replace(decision.path);
  }, [pathname, router, session]);

  return null;
}
