export const getTheme = () => {
    return localStorage.getItem("theme") || "light";
  };
  
  export const setTheme = (theme) => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  };