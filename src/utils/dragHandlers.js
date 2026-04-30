// Логика перетаскивания карточек (dnd-kit)
import { arrayMove } from "@dnd-kit/sortable";

export const handleDragStart = (event, board, setActiveCard) => {
    const { active } = event;
  
    const activeId = String(active.id);
    if (!activeId.startsWith("card-")) return;
  
    const cardId = Number(activeId.replace("card-", ""));
  
    const found = board.columns
      .flatMap(col => col.cards || [])
      .find(c => c.id === cardId);
  
    setActiveCard(found);
  };

  export const handleDragEnd = (
    event,
    board,
    id,
    saveAndUpdate,
    setActiveCard
  ) => {
    const { active, over } = event;

    const activeId = String(active.id);
    if (!activeId.startsWith("card-")) return;

    if (!over) {
        setActiveCard(null);
        return;
    }

    const overId = String(over.id);
    const isColumn = overId.startsWith("column-");
    const isCard = overId.startsWith("card-");

    if (!isColumn && !isCard) {
        setActiveCard(null);
        return;
    }

    const activeCardId = Number(activeId.replace("card-", ""));
    const overCardId = isCard ? Number(overId.replace("card-", "")) : null;
    const overColumnId = isColumn ? Number(overId.replace("column-", "")) : null;

    const sourceColumn = board.columns.find((col) =>
        (col.cards || []).some((card) => card.id === activeCardId)
    );
    if (!sourceColumn) return;

    const targetColumn = overCardId
        ? board.columns.find((col) => (col.cards || []).some((card) => card.id === overCardId))
        : board.columns.find((col) => col.id === overColumnId);
        
    if (!targetColumn) return;

    const movedCard = sourceColumn.cards.find((card) => card.id === activeCardId);
    if (!movedCard) return;

    const updatedColumns = board.columns.map((col) => ({ ...col, cards: [...(col.cards || [])] }));
    const source = updatedColumns.find((col) => col.id === sourceColumn.id);
    const target = updatedColumns.find((col) => col.id === targetColumn.id);
    if (!source || !target) return;

    const sourceIndex = source.cards.findIndex((card) => card.id === activeCardId);
    if (sourceIndex < 0) return;

    if (source.id === target.id && overCardId) {
        const targetIndex = source.cards.findIndex((card) => card.id === overCardId);
        if (targetIndex < 0) return;
        source.cards = arrayMove(source.cards, sourceIndex, targetIndex);

        const data = JSON.parse(localStorage.getItem("boards")) || [];
        const updated = data.map((b) => {
        if (b.id == id) {
            return { ...b, columns: updatedColumns };
        }
        return b;
        });

        saveAndUpdate(updated);
        return;
    }

    source.cards = source.cards.filter((card) => card.id !== activeCardId);

    if (overCardId) {
        const overIndex = target.cards.findIndex((card) => card.id === overCardId);
        const isBelowOverItem =
        active.rect.current.translated &&
        active.rect.current.translated.top > over.rect.top + over.rect.height / 2;

        let insertIndex = overIndex >= 0 ? overIndex : target.cards.length;

        if (source.id === target.id && sourceIndex >= 0 && sourceIndex < overIndex) {
        insertIndex -= 1;
        }

        if (isBelowOverItem) {
        insertIndex += 1;
        }

        insertIndex = Math.max(0, Math.min(insertIndex, target.cards.length));
        target.cards.splice(insertIndex, 0, movedCard);
    } else {
        target.cards.push(movedCard);
    }

    const data = JSON.parse(localStorage.getItem("boards")) || [];
    const updated = data.map((b) => {
        if (b.id == id) {
        return { ...b, columns: updatedColumns };
        }
        return b;
    });

    saveAndUpdate(updated);
};