import { useEffect } from "react";
import { AppShell } from "./components/AppShell";
import { ToastProvider } from "./components/feedback";
import { usePreferences } from "./lib/preferences";
import { matchPath, navigate, useLocation } from "./lib/router";
import { he } from "./locale/he";
import { DashboardPage } from "./screens/dashboard/DashboardPage";
import { HouseholdPage } from "./screens/HouseholdPage";
import { InviteAcceptPage, SetupPage, SignInPage } from "./screens/SignIn";
import { ReviewPage } from "./screens/ReviewPage";
import { SettingsPage } from "./screens/SettingsPage";
import { TransactionsPage } from "./screens/TransactionsPage";
import { UploadPage } from "./screens/UploadPage";
import { type AppState, StoreProvider, useStore } from "./state/store";

/** Routes reachable without a session. The invite screen is shown as the invitee sees it. */
const PUBLIC_ROUTES = ["/sign-in", "/invite/accept"];

function Routes() {
  const { path } = useLocation();
  const { state } = useStore();
  const session = state.session;
  const { startPage } = usePreferences();
  const needsAuth = !PUBLIC_ROUTES.includes(path);
  const needsHousehold = needsAuth && path !== "/setup";
  const redirect =
    needsAuth && !session
      ? "/sign-in"
      : needsHousehold && session && !session.householdId
        ? "/setup"
        : path === "/sign-in" && session?.householdId
          ? startPage
          : null;

  useEffect(() => {
    if (redirect) navigate(redirect, { replace: true });
  }, [redirect]);

  useEffect(() => {
    document.title = he.appName;
  }, []);

  if (redirect) return null;
  if (path === "/sign-in") return <SignInPage />;
  if (path === "/setup") return <SetupPage />;
  if (path === "/invite/accept") return <InviteAcceptPage />;

  let page;
  const review = matchPath("/upload/:documentId/review", path);
  if (path === "/") page = <DashboardPage />;
  else if (path === "/transactions") page = <TransactionsPage />;
  else if (path === "/upload") page = <UploadPage />;
  else if (review) page = <ReviewPage documentId={review.documentId ?? ""} />;
  else if (path === "/household") page = <HouseholdPage />;
  else if (path === "/settings") page = <SettingsPage />;
  else page = <DashboardPage />;
  return <AppShell>{page}</AppShell>;
}

export function App({ initialState }: { initialState?: AppState }) {
  return (
    <StoreProvider {...(initialState ? { initialState } : {})}>
      <ToastProvider>
        <Routes />
      </ToastProvider>
    </StoreProvider>
  );
}
