import { useEffect } from "react";
import { useAuthStore } from "./store/useAuthStore";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";

export default function App() {
  const { user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  return user ? <Dashboard /> : <LoginPage />;
}
