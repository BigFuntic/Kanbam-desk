import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DndContext } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { channel } from "./broadcast";
import { getBoards, saveBoards } from "../api";

function BoardPage() {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [modalMode, setModalMode] = useState("edit");

  useEffect(() => {
    getBoards().then((data) => {
      const foundBoard = data.find((b) => b.id == id);
      setBoard(foundBoard);
    });
  }, [id]);

  useEffect(() => {
    const handler = (event) => {
      const data = event.data;
      const updatedBoard = data.find((b) => b.id == id);
      setBoard(updatedBoard);
    };
  
    channel.addEventListener("message", handler);
  
    return () => {
      channel.removeEventListener("message", handler);
    };
  }, [id]);

  // 2. Функция добавления колонки
  const addColumn = () => {
    const name = prompt("Название колонки");
    if (!name) return;

    const data = JSON.parse(localStorage.getItem("boards")) || [];
    const updated = data.map((b) => {
      if (b.id == id) {
        return {
          ...b,
          columns: [...(b.columns || []), { id: Date.now(), title: name, cards: [] }]
        };
      }
      return b;
    });

    saveAndUpdate(updated);
  };

  const openCreateCardModal = (columnId) => {
    setSelectedCard({
      id: Date.now(),
      title: "",
      description: "",
      deadline: "", 
      columnId,
      images: []
    });
  
    setModalMode("create");
    setIsModalOpen(true);
  };

  // Вспомогательная функция для сохранения, чтобы не дублировать код
  const saveAndUpdate = async (updatedData) => {
    await saveBoards(updatedData);
  
    const newBoard = updatedData.find((b) => b.id == id);
    setBoard(newBoard);
  
    channel.postMessage(updatedData);
  };

  const editCard = (columnId, cardId) => {
    const newTitle = prompt("Новое название");
    const newDescription = prompt("Описание");
    const newDeadline = prompt("Срок (например 2026-04-10)");
  
    const data = JSON.parse(localStorage.getItem("boards")) || [];
  
    const updated = data.map((b) => {
      if (b.id == id) {
        return {
          ...b,
          columns: b.columns.map((col) => {
            if (col.id === columnId) {
              return {
                ...col,
                cards: col.cards.map((card) => {
                  if (card.id === cardId) {
                    return {
                      ...card,
                      title: newTitle || card.title,
                      description: newDescription || card.description,
                      deadline: newDeadline || card.deadline
                    };
                  }
                  return card;
                })
              };
            }
            return col;
          })
        };
      }
      return b;
    });
  
    saveAndUpdate(updated);
  };

  const deleteCard = (columnId, cardId) => {
    const data = JSON.parse(localStorage.getItem("boards")) || [];
  
    const updated = data.map((b) => {
      if (b.id == id) {
        return {
          ...b,
          columns: b.columns.map((col) => {
            if (col.id === columnId) {
              return {
                ...col,
                cards: col.cards.filter((card) => card.id !== cardId)
              };
            }
            return col;
          })
        };
      }
      return b;
    });
  
    saveAndUpdate(updated);
  };

  const deleteColumn = (columnId) => {
    const data = JSON.parse(localStorage.getItem("boards")) || [];
  
    const updated = data.map((b) => {
      if (b.id == id) {
        return {
          ...b,
          columns: b.columns.filter((col) => col.id !== columnId)
        };
      }
      return b;
    });
  
    saveAndUpdate(updated);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
  
    if (!over) return;
  
    const activeId = active.id;
    const overColumnId = over.id;
  
    const data = JSON.parse(localStorage.getItem("boards")) || [];
  
    const updated = data.map((b) => {
      if (b.id == id) {
        let movedCard = null;
  
        // 1. удалить карточку из старой колонки
        const newColumns = b.columns.map((col) => {
          const found = col.cards.find((c) => c.id === activeId);
  
          if (found) {
            movedCard = found;
            return {
              ...col,
              cards: col.cards.filter((c) => c.id !== activeId)
            };
          }
  
          return col;
        });
  
        // 2. добавить в новую колонку
        return {
          ...b,
          columns: newColumns.map((col) => {
            if (col.id === overColumnId) {
              return {
                ...col,
                cards: [...col.cards, movedCard]
              };
            }
            return col;
          })
        };
      }
      return b;
    });
  
    saveAndUpdate(updated);
  };

  const openEditModal = (card, columnId) => {
    setSelectedCard({ ...card, columnId });
    setModalMode("edit");
    setIsModalOpen(true);
  };
  
  const saveCardChanges = () => {
    const data = JSON.parse(localStorage.getItem("boards")) || [];
  
    const updated = data.map((b) => {
      if (b.id == id) {
        return {
          ...b,
          columns: b.columns.map((col) => {
            if (col.id === selectedCard.columnId) {
              
              // 👉 ЕСЛИ СОЗДАНИЕ
              if (modalMode === "create") {
                return {
                  ...col,
                  cards: [...col.cards, selectedCard]
                };
              }
  
              // 👉 ЕСЛИ РЕДАКТИРОВАНИЕ
              return {
                ...col,
                cards: col.cards.map((card) => {
                  if (card.id === selectedCard.id) {
                    return selectedCard;
                  }
                  return card;
                })
              };
            }
            return col;
          })
        };
      }
      return b;
    });
  
    saveAndUpdate(updated);
    setIsModalOpen(false);
  };

  if (!board) return <div>Загрузка...</div>;

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {
    <div style={{ padding: 20 }}>
      <h1>{board.title}</h1>
      <button onClick={() => navigate("/")}>
        ← Назад к доскам
      </button>
      <button onClick={addColumn}>Добавить колонку</button>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
      {board.columns?.map((col) => (
        <Column key={col.id} col={col}>

          <button onClick={() => openCreateCardModal(col.id)}>
            Добавить карточку
          </button>

          <button onClick={() => deleteColumn(col.id)}>
            Удалить колонку
          </button>

          <div style={{ marginTop: 10 }}>
            {col.cards?.map((card) => (
              <Card
                key={card.id}
                card={card}
                col={col}
                editCard={editCard}
                deleteCard={deleteCard}
                openEditModal={openEditModal}
              />
            ))}
          </div>

        </Column>
      ))}
      </div>
      {isModalOpen && (
        <Modal
          card={selectedCard}
          setCard={setSelectedCard}
          onClose={() => setIsModalOpen(false)}
          onSave={saveCardChanges}
        />
      )}
    </div>
}
  </DndContext>
  );
}

function Card({ card, col, editCard, deleteCard, openEditModal }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.id
  });

  const style = {
    border: "1px solid black",
    padding: 5,
    marginTop: 5,
    background: "white",
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : ""
  };

  return (
    <div ref={setNodeRef} style={style}>
      
      {/* 👇 DRAG ТОЛЬКО ЗДЕСЬ */}
      <div
        {...listeners}
        {...attributes}
        style={{ cursor: "grab" }}
      >
        <b onClick={() => editCard(col.id, card.id)}>
          {card.title}
        </b>
      </div>

      {card.images?.length > 0 && (
        <div style={{ marginTop: 5 }}>
          {card.images.map((img, i) => (
            <img key={i} src={img} width={50} style={{ marginRight: 5 }} />
          ))}
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteCard(col.id, card.id);
        }}
      >
        ❌
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          openEditModal(card, col.id);
        }}
      >
        ✏️
      </button>

      {card.description && (
        <div style={{ fontSize: 12 }}>{card.description}</div>
      )}

      {card.deadline && (
        <div style={{ fontSize: 12 }}>
          ⏰ {card.deadline}
        </div>
      )}
    </div>
  );
}
function Column({ col, children }) {
  const { setNodeRef } = useDroppable({
    id: col.id
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        border: "1px solid gray",
        padding: 10,
        minWidth: 200
      }}
    >
      <h3>{col.title}</h3>
      {children}
    </div>
  );
}

function Modal({ card, setCard, onClose, onSave }) {
  if (!card) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)"
    }}>
      <div style={{
        background: "white",
        padding: 20,
        margin: "100px auto",
        width: 300
      }}>
        <h3>
          {card.title ? "Редактировать карточку" : "Создать карточку"}
        </h3>

        <input
          value={card.title}
          onChange={(e) =>
            setCard({ ...card, title: e.target.value })
          }
          placeholder="Название"
        />

        <textarea
          value={card.description}
          onChange={(e) =>
            setCard({ ...card, description: e.target.value })
          }
          placeholder="Описание"
        />

        <input
          type="file"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files);

            files.forEach((file) => {
              const reader = new FileReader();

              reader.onload = () => {
                setCard((prev) => ({
                  ...prev,
                  images: [...(prev.images || []), reader.result]
                }));
              };

              reader.readAsDataURL(file);
            });
          }}
        />

        <div style={{ marginTop: 10 }}>
          {card.images?.map((img, index) => (
            <div key={index} style={{ position: "relative", marginBottom: 5 }}>
              <img src={img} width={100} />

              <button
                onClick={() => {
                  const newImages = card.images.filter((_, i) => i !== index);
                  setCard({ ...card, images: newImages });
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0
                }}
              >
                ❌
              </button>
            </div>
          ))}
        </div>

        <input
          value={card.deadline}
          onChange={(e) =>
            setCard({ ...card, deadline: e.target.value })
          }
          placeholder="Срок"
        />

        <br /><br />

        <button onClick={onSave}>Сохранить</button>
        <button onClick={onClose}>Закрыть</button>
      </div>
    </div>
  );
}

export default BoardPage;