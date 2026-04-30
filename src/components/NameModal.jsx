import { useState } from "react";

export default function NameModal({ title, value, placeholder, onChange, onClose, onSave, saveLabel }) {

  const handleSubmit = (e) => {
    e.preventDefault(); 
    if (value.trim()) {
      onSave();
    }
  };

  return (
    <div className="modal-overlay">
      <form className="modal-content modal-content--compact" onSubmit={handleSubmit}>
        <h3>{title}</h3>
        
        <input
          className="modal-field"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoFocus
        />
        
        <div className="modal-actions">
          <button type="button" className="button-secondary" onClick={onClose}>
            Отмена
          </button>
          
          <button type="submit" className="button-primary" disabled={!value.trim()}>
            {saveLabel}
          </button>
        </div>
      </form>
    </div>
  );
}