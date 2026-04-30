// Утилиты для генерации ID и порядка колонок/карточек
export const getNextCardId = (columns = []) => {
    const maxCardId = columns.reduce((maxId, column) => {
      const columnMax = (column.cards || []).reduce((innerMax, card) => {
        return typeof card.id === "number" && card.id > innerMax ? card.id : innerMax;
      }, 0);
      return columnMax > maxId ? columnMax : maxId;
    }, 0);
    return maxCardId + 1;
  };
  
  export const getNextColumnId = (columns = []) => {
    const maxColumnId = columns.reduce((maxId, column) => {
      return typeof column.id === "number" && column.id > maxId ? column.id : maxId;
    }, 0);
    return maxColumnId + 1;
  };
  
  export const getNextColumnOrder = (columns = []) => {
    const maxOrder = columns.reduce((maxValue, column, index) => {
      const fallbackOrder = index;
      const columnOrder = typeof column.order === "number" ? column.order : fallbackOrder;
      return columnOrder > maxValue ? columnOrder : maxValue;
    }, -1);
    return maxOrder + 1;
  };