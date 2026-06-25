import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, onMount } from "solid-js";
import { getRequestEvent } from "solid-js/web";
import { useAuth } from "./hooks/useAuth";
import { I18nProvider } from "./i18n/context";
import { resolveClientPreferredLocale, resolveServerPreferredLocale } from "./i18n/config";
import "./app.css";

function resolvePreferredLocaleForRequest() {
  if (typeof window !== "undefined") {
    return resolveClientPreferredLocale();
  }

  const requestEvent = getRequestEvent();
  return requestEvent ? resolveServerPreferredLocale(requestEvent.request.headers) : resolveClientPreferredLocale();
}

function AppRoot(props: { children: any }) {
  const auth = useAuth();
  const activeLocale = resolvePreferredLocaleForRequest();

  onMount(() => {
    void auth.initialize().catch(() => {
      // Session restoration should not block initial rendering.
    });
  });

  if (typeof document !== "undefined") {
    document.documentElement.lang = activeLocale;
  }

  return <I18nProvider forcedLocale={activeLocale}>{props.children}</I18nProvider>;
}

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>ASSETAR</Title>
          <Suspense>
            <AppRoot>{props.children}</AppRoot>
          </Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
