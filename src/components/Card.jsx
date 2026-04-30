import { useSortable } from "@dnd-kit/sortable";

export default function Card({ card, col, editCard, deleteCard, openEditModal, toggleCardCompletion }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${card.id}`
  });

  const style = {
    transition,
    // Если перетаскиваем - 0.3, если выполнено - 0.5 (потускнение), иначе 1
    opacity: isDragging ? 0.3 : (card.completed ? 0.5 : 1)
  };

  return (
    <div ref={setNodeRef} style={style} className={`card-item ${card.completed ? "card-item--completed" : ""}`}>
      <div className="card-header-row">
        
        <input 
          type="checkbox" 
          checked={!!card.completed}
          onChange={() => toggleCardCompletion(col.id, card.id)}
          className="card-checkbox"
        />

        <div
          {...listeners}
          {...attributes}
          className="card-title-wrap"
        >
          <span 
            className={`card-title ${card.completed ? "card-title--completed" : ""}`} 
            onClick={() => editCard(col.id, card.id)}
          >
            {card.title}
          </span>
        </div>
      </div>

      {card.images?.length > 0 && (
        <div className="card-images">
          {card.images.map((img, i) => (
            <img key={i} src={img} className="card-image" />
          ))}
        </div>
      )}

      <button
        className="card-edit-btn"
        onClick={(e) => {
          e.stopPropagation();
          openEditModal(card, col.id);
        }}
      >
        •••
      </button>

      {card.description && (
        <div className="card-meta">{card.description}</div>
      )}

      {card.deadline && (
        <div className="card-meta">
          ⏰ {new Date(card.deadline).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}