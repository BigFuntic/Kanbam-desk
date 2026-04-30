import { useState, useEffect } from "react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { DndContext, closestCenter, useDroppable } from "@dnd-kit/core";
import { DragOverlay } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

import {
  getNextCardId,
  getNextColumnId,
  getNextColumnOrder
} from "../utils/boardHelpers"; // Утилиты для генерации ID и порядка колонок/карточек
import { handleDragStart, handleDragEnd } from "../utils/dragHandlers"; // Логика перетаскивания карточек (dnd-kit)
import { useBoard } from "../hooks/useBoard";// Хук для работы с доской: загрузка, синхронизация между вкладками, сохранение

import Card from "../components/Card.jsx";
import Column from "../components/Column.jsx";
import Modal from "../components/Modal.jsx";
import NameModal from "../components/NameModal.jsx";

function BoardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { board, setBoard, saveAndUpdate } = useBoard(id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [modalMode, setModalMode] = useState("edit");
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [activeCard, setActiveCard] = useState(null);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  

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
      images: [],
      completed: false // ДОБАВЛЕНО: статус по умолчанию
    });
  
    setModalMode("create");
    setIsModalOpen(true);
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

  const toggleCardCompletion = (columnId, cardId) => {
    const updatedColumns = board.columns.map((col) => {
      if (col.id === columnId) {
        return {
          ...col,
          cards: col.cards.map((card) => {
            if (card.id === cardId) {
              return {
                ...card,
                completed: !card.completed
              };
            }
            return card;
          })
        };
      }
      return col;
    });
  
    const updatedBoards = JSON.parse(localStorage.getItem("boards")) || [];
  
    const final = updatedBoards.map((b) => {
      if (b.id == id) {
        return {
          ...b,
          columns: updatedColumns
        };
      }
      return b;
    });
  
    saveAndUpdate(final);
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
    const confirmDelete = window.confirm("Удалить колонку? Все карточки внутри будут потеряны.");
  
    if (!confirmDelete) return;
  
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

  // Переключение закрепления колонки:
  // закрепленные всегда идут первыми,
  // порядок остальных сохраняется
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

  const openEditModal = (card, columnId) => {
    setSelectedCard({ ...card, columnId });
    setModalMode("edit");
    setIsModalOpen(true);
  };
  
  // Сохранение карточки:
  // - create: добавляем новую
  // - edit: обновляем существующую
  // - delete: удаляем
  const saveCardChanges = (mode = "save") => {
    if (mode === "delete") {
      const data = JSON.parse(localStorage.getItem("boards")) || [];
    
      const updated = data.map((b) => {
        if (b.id == id) {
          return {
            ...b,
            columns: b.columns.map((col) => {
              if (col.id === selectedCard.columnId) {
                return {
                  ...col,
                  cards: col.cards.filter(
                    (card) => card.id !== selectedCard.id
                  )
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
      return;
    }

    if (!selectedCard.title.trim()) {
      alert("Введите название карточки");
      return;
    }

    const data = JSON.parse(localStorage.getItem("boards")) || [];

    const updated = data.map((b) => {
      if (b.id == id) {
        return {
          ...b,
          columns: b.columns.map((col) => {
            if (col.id === selectedCard.columnId) {
              
              if (modalMode === "create") {
                return {
                  ...col,
                  cards: [...col.cards, selectedCard]
                };
              }
  
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

  // Drag-scroll доски (горизонтальный скролл зажатой мышью)
  const boardRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e) => {
    setIsDraggingBoard(true);
    isDraggingRef.current = true;
    startX.current = e.clientX;
    scrollLeft.current = boardRef.current.scrollLeft;
  };
  
  const onMouseMove = (e) => {
    if (!isDraggingRef.current || activeCard) return;
  
    const x = e.clientX;
    const walk = (x - startX.current) * 1.2;
  
    boardRef.current.scrollLeft = scrollLeft.current - walk;
  };
  
  const onMouseUp = () => {
    setIsDraggingBoard(false);
    isDraggingRef.current = false;
  };
  
  const onMouseLeave = () => {
    setIsDraggingBoard(false);
    isDraggingRef.current = false;
  };

  if (!board) return <div>Загрузка...</div>;

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={(e) => handleDragStart(e, board, setActiveCard)}
      onDragEnd={(e) =>
        handleDragEnd(e, board, id, saveAndUpdate, setActiveCard)
      }
    >
      <div className="page-shell page-shell--board">
        <div className="page-header">
          <div>
            <h1 className="page-title">{board.title}</h1>
          </div>
          <div className="board-card__actions">
            <button className="button-secondary" onClick={() => navigate("/")}>
              К доскам
            </button>
            <button className="button-primary" onClick={() => setIsColumnModalOpen(true)}>
              Добавить колонку
            </button>
          </div>
        </div>

        <div
          className={`board-layout ${isDraggingBoard ? "no-select" : ""}`}
          ref={boardRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          {board.columns?.map((col) => (
            <Column 
              key={col.id} 
              col={col} 
              togglePinColumn={togglePinColumn}
            >
              <div className="column-actions">
                <button className="button-secondary" onClick={() => openCreateCardModal(col.id)}>
                  Добавить карточку
                </button>

                <button className="button-danger" onClick={() => deleteColumn(col.id)}>
                  Удалить колонку
                </button>
              </div>

              <SortableContext
                items={(col.cards || []).map((card) => `card-${card.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <div>
                  {col.cards?.map((card) => (
                    <Card
                      key={card.id}
                      card={card}
                      col={col}
                      editCard={editCard}
                      
                      openEditModal={openEditModal}
                      toggleCardCompletion={toggleCardCompletion} 
                    />
                  ))}
                </div>
              </SortableContext>
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

      <DragOverlay>
        {activeCard ? (
          <div className="card-item" style={{ opacity: 0.8 }}>
            {activeCard.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default BoardPage;