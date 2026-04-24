import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBoards, saveBoards } from "../api";
import { channel } from "./broadcast";
import { clearSessionUser, getSessionUser, setSessionUser } from "../sessionUser";

function SettingsPage() {
  const navigate = useNavigate();
  const [name, setName] = useState(() => getSessionUser() || "");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const user = getSessionUser();
    if (!user) {
      navigate("/login");
    }
  }, [navigate]);

  const saveName = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const currentUser = getSessionUser();
    if (!currentUser) return;

    if (trimmedName === currentUser) {
      setStatus("Имя не изменилось.");
      return;
    }

    const allBoards = await getBoards();
    const renamedBoards = allBoards.map((board) => {
      if (board.user === currentUser) {
        return { ...board, user: trimmedName };
      }
      return board;
    });

    await saveBoards(renamedBoards);
    channel.postMessage(renamedBoards);
    setSessionUser(trimmedName);
    setStatus("Имя обновлено для текущего пользователя.");
  };

  const clearMyBoards = async () => {
    const user = getSessionUser();
    if (!user) return;

    const allBoards = await getBoards();
    const filteredBoards = allBoards.filter((board) => board.user !== user);
    await saveBoards(filteredBoards);
    channel.postMessage(filteredBoards);
    setStatus("Все ваши доски удалены.");
  };

  const logout = () => {
    clearSessionUser();
    navigate("/login");
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Настройки</h1>
          <p className="page-subtitle">Управляйте профилем и данными аккаунта.</p>
        </div>
        <button className="button-secondary" onClick={() => navigate("/")}>
          ← К доскам
        </button>
      </div>

      <div className="settings-card">
        <h3>Профиль</h3>
        <p>Имя пользователя используется для разделения досок между аккаунтами.</p>
        <input
          className="modal-field"
          placeholder="Ваше имя"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="settings-actions">
          <button className="button-primary" onClick={saveName} disabled={!name.trim()}>
            Сохранить имя
          </button>
        </div>
      </div>

      <div className="settings-card">
        <h3>Данные</h3>
        <p>Удалите ваши доски, если хотите начать с чистого листа.</p>
        <div className="settings-actions">
          <button className="button-danger" onClick={clearMyBoards}>
            Удалить мои доски
          </button>
          <button className="button-secondary" onClick={logout}>
            Выйти из аккаунта
          </button>
        </div>
      </div>

      {status && <p className="settings-status">{status}</p>}
    </div>
  );
}

export default SettingsPage;
