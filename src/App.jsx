import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import BoardsPage from "./pages/BoardsPage";
import BoardPage from "./pages/BoardPage";
import LoginPage from "./pages/LoginPage";
import { getSessionUser } from "./sessionUser";

function App() {
  // Подписка на смену URL: иначе после navigate() родитель может не перерисоваться,
  // и element у Route останется со старым user (например, всё ещё null после входа).
  useLocation();
  const user = getSessionUser();

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

      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

export default App;