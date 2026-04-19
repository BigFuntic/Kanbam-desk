import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { channel } from "./broadcast";
import { getSessionUser, clearSessionUser } from "../sessionUser";
import { getBoards, saveBoards } from "../api";

function BoardsPage() {
  const [boards, setBoards] = useState([]);
  const navigate = useNavigate();

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
    const name = prompt("Название доски");
    if (!name) return;

    const user = getSessionUser();

    if (!user) {
      alert("Вы не авторизованы");
      navigate("/login");
      return;
    }

    const newBoard = {
      id: Date.now(),
      title: name,
      user: getSessionUser(),
      columns: []
    };

    const updated = [...boards, newBoard];

    setBoards(updated);
    saveBoards(updated);
    channel.postMessage(updated);
  };

  const deleteBoard = (boardId) => {
    const updated = boards.filter((b) => b.id !== boardId);

    setBoards(updated);
    saveBoards(updated);
    channel.postMessage(updated);
  };

  const user = getSessionUser();
  const myBoards = boards.filter((b) => b.user === user);

  return (
    <div style={{ padding: 20 }}>
      <h1>Мои доски</h1>

      <button onClick={addBoard}>Создать доску</button>

      <button
        onClick={() => {
          clearSessionUser();
          navigate("/login");
        }}
        style={{ marginLeft: 10 }}
      >
        Выйти
      </button>

      {myBoards.length === 0 && (
        <p style={{ marginTop: 20 }}>У вас пока нет досок</p>
      )}

      {myBoards.map((board) => (
        <div
          key={board.id}
          style={{
            border: "1px solid gray",
            margin: "10px 0",
            padding: 10,
            cursor: "pointer"
          }}
        >
          <div onClick={() => navigate(`/board/${board.id}`)}>
            {board.title}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteBoard(board.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default BoardsPage;
