import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import BoardsPage from "./pages/BoardsPage";
import BoardPage from "./pages/BoardPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import { getSessionUser } from "./sessionUser";
import { useEffect } from "react";
import { getTheme, setTheme } from "./theme";

function App() {
  // Подписка на смену URL: иначе после navigate() родитель может не перерисоваться,
  // и element у Route останется со старым user (например, всё ещё null после входа).
  useLocation();
  const user = getSessionUser();

  useEffect(() => {
    const savedTheme = getTheme();
    setTheme(savedTheme);
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <BoardsPage /> : <Navigate to="/login" />}
      />

      <Route
        path="/board/:id"
        element={user ? <BoardPage /> : <Navigate to="/login" />}
      />

      <Route
        path="/settings"
        element={user ? <SettingsPage /> : <Navigate to="/login" />}
      />

      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

export default App;