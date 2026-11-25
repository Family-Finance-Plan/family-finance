import { ServerStatus } from "./health/ServerStatus";
import { he } from "./locale/he";

export function App() {
  return (
    <main className="app">
      <h1>{he.appName}</h1>
      <ServerStatus />
    </main>
  );
}
