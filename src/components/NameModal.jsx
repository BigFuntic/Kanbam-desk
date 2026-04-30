import { useState } from "react";

export default function NameModal({ title, value, placeholder, onChange, onClose, onSave, saveLabel }) {
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