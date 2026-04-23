import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { channel } from "./broadcast";
import { getSessionUser, clearSessionUser } from "../sessionUser";
import { getBoards, saveBoards } from "../api";

function BoardsPage() {
  const [boards, setBoards] = useState([]);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const navigate = useNavigate();

  const getNextBoardId = () => {
    const maxBoardId = boards.reduce((maxId, board) => {
      return typeof board.id === "number" && board.id > maxId ? board.id : maxId;
    }, 0);
    return maxBoardId + 1;
  };

  useEffect(() => {
    getBoards().then(setBoards);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      setBoards(event.data);
    };

    channel.addEventListener("message", handler);

    return () => {
      channel.removeEventListener("message", handler);
    };
  }, []);

  const addBoard = () => {
    const name = newBoardTitle.trim();
    if (!name) return;

    const user = getSessionUser();

    if (!user) {
      alert("Вы не авторизованы");
      navigate("/login");
      return;
    }

    const newBoard = {
      id: getNextBoardId(),
      title: name,
      user,
      columns: [],
      pinned: false,
      order: boards.length 
    };

    const updated = [...boards, newBoard];

    setBoards(updated);
    saveBoards(updated);
    channel.postMessage(updated);
    setNewBoardTitle("");
    setIsCreateBoardModalOpen(false);
  };

  const deleteBoard = (boardId) => {
    const updated = boards.filter((b) => b.id !== boardId);

    setBoards(updated);
    saveBoards(updated);
    channel.postMessage(updated);
  };

  const togglePinBoard = (boardId) => {
    const toggledBoard = boards.find((b) => b.id === boardId);
    if (!toggledBoard) return;

    const willBePinned = !toggledBoard.pinned;

    let updated = boards.map((b) => {
      if (b.id === boardId) {
        return { ...b, pinned: willBePinned };
      }
      return b;
    });
  
    // разделяем
    let pinned = updated.filter((b) => b.pinned);
    const unpinned = updated
      .filter((b) => !b.pinned)
      .sort((a, b) => a.order - b.order);

    if (willBePinned) {
      const newlyPinned = pinned.find((b) => b.id === boardId);
      const otherPinned = pinned.filter((b) => b.id !== boardId);
      pinned = newlyPinned ? [newlyPinned, ...otherPinned] : otherPinned;
    }
  
    // 👇 закрепленные всегда сверху
    updated = [...pinned, ...unpinned];
  
    setBoards(updated);
    localStorage.setItem("boards", JSON.stringify(updated));
    channel.postMessage(updated);
  };

  const user = getSessionUser();
  const myBoards = boards.filter((b) => b.user === user);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Мои доски</h1>
          <p className="page-subtitle">Управляйте задачами в удобном визуальном формате.</p>
        </div>
        <div className="board-card__actions">
          <button className="button-primary" onClick={() => setIsCreateBoardModalOpen(true)}>
            Создать доску
          </button>
          <button
            className="button-secondary"
            onClick={() => {
              clearSessionUser();
              navigate("/login");
            }}
          >
            Выйти
          </button>
        </div>
      </div>

      {myBoards.length === 0 && (
        <p>У вас пока нет досок. Создайте первую, чтобы начать работу.</p>
      )}

      <div className="boards-grid">
        {myBoards.map((board) => (
          <div key={board.id} className="board-card">
            <div
              className="board-card__title"
              onClick={() => navigate(`/board/${board.id}`)}
            >
              {board.title}
            </div>
            <div className="board-card__meta">
              {board.pinned ? "Закреплена вверху списка" : "Обычная доска"}
            </div>
            <div className="board-card__actions">
              <button
                className="button-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePinBoard(board.id);
                }}
              >
                {board.pinned ? "📌 Закреплено" : "📍 Закрепить"}
              </button>
              <button
                className="button-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBoard(board.id);
                }}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      {isCreateBoardModalOpen && (
        <NameModal
          title="Создать доску"
          value={newBoardTitle}
          placeholder="Название доски"
          onChange={setNewBoardTitle}
          onClose={() => {
            setIsCreateBoardModalOpen(false);
            setNewBoardTitle("");
          }}
          onSave={addBoard}
          saveLabel="Создать"
        />
      )}
    </div>
  );
}

function NameModal({ title, value, placeholder, onChange, onClose, onSave, saveLabel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content--compact">
        <h3>{title}</h3>
        <input
          className="modal-field"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoFocus
        />
        <div className="modal-actions">
          <button className="button-secondary" onClick={onClose}>Отмена</button>
          <button className="button-primary" onClick={onSave} disabled={!value.trim()}>
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BoardsPage;
