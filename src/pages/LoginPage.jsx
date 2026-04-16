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
    <div style={{ padding: 50 }}>
      <h2>Вход</h2>

      <input
        placeholder="Введите имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <button onClick={handleLogin}>
        Войти
      </button>
    </div>
  );
}

export default LoginPage;