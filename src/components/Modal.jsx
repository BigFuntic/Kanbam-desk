
import { useState } from "react";
export default 

function Modal({ card, setCard, onClose, onSave }) {
  const [error, setError] = useState("");
  if (!card) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-body">
          <h3>
            {card.title ? "Редактировать карточку" : "Создать карточку"}
          </h3>

          <input
            className="modal-field"
            value={card.title}
            onChange={(e) => {
              setCard({ ...card, title: e.target.value });
              setError("");
            }}
            placeholder="Название"
          />

          {error && <div className="modal-error">{error}</div>} 

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
              <div key={index} className="modal-image-wrap">
                <img src={img} width={100} className="modal-image" />

                <button
                  className="button-danger modal-image-delete"
                  onClick={() => {
                    const newImages = card.images.filter((_, i) => i !== index);
                    setCard({ ...card, images: newImages });
                  }}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>

          <input
            className="modal-field"
            type="date"
            value={card.deadline || ""}
            onChange={(e) =>
              setCard({ ...card, deadline: e.target.value })
            }
          />
        </div>
        <div className="modal-actions">
          <button className="button-secondary" onClick={onClose}>Закрыть</button>

          <button className="button-danger" onClick={() => {
            const confirmDelete = window.confirm("Удалить карточку?");
            if (!confirmDelete) return;

            onSave("delete");
          }}>
            Удалить
          </button>

          <button
            className="button-primary"
            disabled={!card.title.trim()}
            onClick={() => {
              if (!card.title.trim()) {
                setError("Название обязательно");
                return;
              }

              setError("");
              onSave();
            }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
