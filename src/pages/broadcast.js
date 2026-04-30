// BroadcastChannel для синхронизации вкладок
// отправляем обновления досок между окнами
export const channel = new BroadcastChannel("boards");