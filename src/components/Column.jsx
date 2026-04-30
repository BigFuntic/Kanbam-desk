import { useDroppable } from "@dnd-kit/core";

export default function Column({ col, children, togglePinColumn }) {
  const { setNodeRef } = useDroppable({
    id: `column-${col.id}`
  });

  return (
    <div
      ref={setNodeRef}
      className={`column ${col.pinned ? "column--pinned" : ""}`}
    >
      <button
        className="button-secondary pin-btn"
        onClick={(e) => {
          e.stopPropagation();
          togglePinColumn(col.id);
        }}
      >
        📌
      </button>

      <div className="column-header">
        <h3>{col.title}</h3>
      </div>

      {children}
    </div>
  );
}