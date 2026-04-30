// Хук для работы с доской: загрузка, синхронизация между вкладками, сохранение
import { useState, useEffect } from "react";
import { getBoards, saveBoards } from "../api";
import { channel } from "../pages/broadcast"; 

export function useBoard(id) {
    const [board, setBoard] = useState(null);
  
    useEffect(() => {
      getBoards().then((data) => {
        const foundBoard = data.find((b) => b.id == id);
        setBoard(foundBoard);
      });
    }, [id]);
  
    useEffect(() => {
      const handler = (event) => {
        const data = event.data;
        const updatedBoard = data.find((b) => b.id == id);
        setBoard(updatedBoard);
      };
  
      channel.addEventListener("message", handler);
  
      return () => {
        channel.removeEventListener("message", handler);
      };
    }, [id]);
  
    const saveAndUpdate = async (updatedData) => {
      const newBoard = updatedData.find((b) => b.id == id);
      setBoard(newBoard);
      channel.postMessage(updatedData);
  
      await saveBoards(updatedData);
    };
  
    return {
      board,
      setBoard,
      saveAndUpdate
    };
  }
