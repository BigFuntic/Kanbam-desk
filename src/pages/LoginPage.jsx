import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setSessionUser } from "../sessionUser";

function LoginPage() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!name) return;

    setSessionUser(name);
    navigate("/");
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
      <h2>Добро пожаловать</h2>
      <p>Войдите, чтобы продолжить работу с вашими досками.</p>
      <form onSubmit={handleLogin}>
        <input
          className="auth-field"
          placeholder="Введите имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button 
          type="submit"
          className="button-primary">
          Войти
        </button>
      </form>
      </div>
    </div>
  );
}

export default LoginPage;