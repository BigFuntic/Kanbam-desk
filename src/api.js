const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// 🔹 получить все доски
export const getBoards = async () => {
  await delay(400);

  const data = JSON.parse(localStorage.getItem("boards")) || [];
  return data;
};

// 🔹 сохранить все доски
export const saveBoards = async (boards) => {
  await delay(400);

  localStorage.setItem("boards", JSON.stringify(boards));
  return boards;
};