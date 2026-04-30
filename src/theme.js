// Получение текущей темы из localStorage
export const getTheme = () => {
    return localStorage.getItem("theme") || "light";
  };
  
// Установка темы 
  export const setTheme = (theme) => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  };