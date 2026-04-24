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
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  const getNextCardId = (columns = []) => {
    const maxCardId = columns.reduce((maxId, column) => {
      const columnMax = (column.cards || []).reduce((innerMax, card) => {
        return typeof card.id === "number" && card.id > innerMax ? card.id : innerMax;
      }, 0);
      return columnMax > maxId ? columnMax : maxId;
    }, 0);
    return maxCardId + 1;
  };

  const getNextColumnId = (columns = []) => {
    const maxColumnId = columns.reduce((maxId, column) => {
      return typeof column.id === "number" && column.id > maxId ? column.id : maxId;
    }, 0);
    return maxColumnId + 1;
  };

  const getNextColumnOrder = (columns = []) => {
    const maxOrder = columns.reduce((maxValue, column, index) => {
      const fallbackOrder = index;
      const columnOrder = typeof column.order === "number" ? column.order : fallbackOrder;
      return columnOrder > maxValue ? columnOrder : maxValue;
    }, -1);
    return maxOrder + 1;
  };

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
    const name = newColumnTitle.trim();
    if (!name) return;

    const data = JSON.parse(localStorage.getItem("boards")) || [];
    const updated = data.map((b) => {
      if (b.id == id) {
        return {
          ...b,
          columns: [
            ...(b.columns || []),
            {
              id: getNextColumnId(b.columns),
              title: name,
              cards: [],
              pinned: false,
              order: getNextColumnOrder(b.columns || [])
            }
          ]
        };
      }
      return b;
    });

    saveAndUpdate(updated);
    setNewColumnTitle("");
    setIsColumnModalOpen(false);
  };

  const openCreateCardModal = (columnId) => {
    setSelectedCard({
      id: getNextCardId(board?.columns),
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

  const togglePinColumn = (columnId) => {
    const data = JSON.parse(localStorage.getItem("boards")) || [];

    const updated = data.map((b) => {
      if (b.id != id) return b;

      const targetColumn = (b.columns || []).find((col) => col.id === columnId);
      if (!targetColumn) return b;

      const willBePinned = !targetColumn.pinned;
      const columnsWithOrder = (b.columns || []).map((col, index) => {
        if (typeof col.order === "number") return col;
        return { ...col, order: index };
      });

      const toggledColumns = columnsWithOrder.map((col) => {
        if (col.id === columnId) {
          return { ...col, pinned: willBePinned };
        }
        return col;
      });

      let pinned = toggledColumns.filter((col) => col.pinned);
      const unpinned = toggledColumns
        .filter((col) => !col.pinned)
        .sort((a, b) => a.order - b.order);

      if (willBePinned) {
        const newlyPinned = pinned.find((col) => col.id === columnId);
        const otherPinned = pinned.filter((col) => col.id !== columnId);
        pinned = newlyPinned ? [newlyPinned, ...otherPinned] : otherPinned;
      }

      return {
        ...b,
        columns: [...pinned, ...unpinned]
      };
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
      <div className="page-shell">
        <div className="page-header">
          <div>
            <h1 className="page-title">{board.title}</h1>
            <p className="page-subtitle">Перетаскивайте карточки между колонками.</p>
          </div>
          <div className="board-card__actions">
            <button className="button-secondary" onClick={() => navigate("/")}>
              ← К доскам
            </button>
            <button className="button-primary" onClick={() => setIsColumnModalOpen(true)}>
              Добавить колонку
            </button>
          </div>
        </div>

        <div className="board-layout">
          {board.columns?.map((col) => (
            <Column key={col.id} col={col}>
              <button className="button-secondary" onClick={() => openCreateCardModal(col.id)}>
                Добавить карточку
              </button>
              <button className="button-secondary" onClick={() => togglePinColumn(col.id)}>
                {col.pinned ? "📌 Закреплена" : "📍 Закрепить"}
              </button>

              <button className="button-danger" onClick={() => deleteColumn(col.id)}>
                Удалить колонку
              </button>

              <div>
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

        {isColumnModalOpen && (
          <NameModal
            title="Добавить колонку"
            value={newColumnTitle}
            placeholder="Название колонки"
            onChange={setNewColumnTitle}
            onClose={() => {
              setIsColumnModalOpen(false);
              setNewColumnTitle("");
            }}
            onSave={addColumn}
            saveLabel="Добавить"
          />
        )}
      </div>
    </DndContext>
  );
}

function Card({ card, col, editCard, deleteCard, openEditModal }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.id
  });

  const style = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : ""
  };

  return (
    <div ref={setNodeRef} style={style} className="card-item">
      <div
        {...listeners}
        {...attributes}
        style={{ cursor: "grab" }}
      >
        <span className="card-title" onClick={() => editCard(col.id, card.id)}>
          {card.title}
        </span>
      </div>

      {card.images?.length > 0 && (
        <div className="card-meta">
          {card.images.map((img, i) => (
            <img key={i} src={img} width={50} style={{ marginRight: 5, borderRadius: 6 }} />
          ))}
        </div>
      )}

      <button
        className="button-danger"
        onClick={(e) => {
          e.stopPropagation();
          deleteCard(col.id, card.id);
        }}
      >
        Удалить
      </button>

      <button
        className="button-secondary"
        onClick={(e) => {
          e.stopPropagation();
          openEditModal(card, col.id);
        }}
      >
        Редактировать
      </button>

      {card.description && (
        <div className="card-meta">{card.description}</div>
      )}

      {card.deadline && (
        <div className="card-meta">
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
      className="column"
    >
      <div className="column-header">
        <h3>{col.title}</h3>
      </div>
      {children}
    </div>
  );
}

function Modal({ card, setCard, onClose, onSave }) {
  if (!card) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>
          {card.title ? "Редактировать карточку" : "Создать карточку"}
        </h3>

        <input
          className="modal-field"
          value={card.title}
          onChange={(e) =>
            setCard({ ...card, title: e.target.value })
          }
          placeholder="Название"
        />

        <textarea
          className="modal-field"
          value={card.description}
          onChange={(e) =>
            setCard({ ...card, description: e.target.value })
          }
          placeholder="Описание"
        />

        <input
          className="modal-field"
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

        <div className="card-meta">
          {card.images?.map((img, index) => (
            <div key={index} style={{ position: "relative", marginBottom: 5 }}>
              <img src={img} width={100} style={{ borderRadius: 8 }} />

              <button
                className="button-danger"
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
          className="modal-field"
          value={card.deadline}
          onChange={(e) =>
            setCard({ ...card, deadline: e.target.value })
          }
          placeholder="Срок"
        />

        <div className="modal-actions">
          <button className="button-secondary" onClick={onClose}>Закрыть</button>
          <button className="button-primary" onClick={onSave}>Сохранить</button>
        </div>
      </div>
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

export default BoardPage;