import { useState, useEffect, useCallback, useRef } from "react";
import { ChatUseCase } from "../../domain/useCases/chat/ChatUseCase";
import { Mensaje } from "../../domain/models/Mensaje";

const chatUseCase = new ChatUseCase();

export const useChat = (receptorId?: string) => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [quienEscribe, setQuienEscribe] = useState<string | null>(null);
  
  const typingTimeoutRef = useRef<number | null>(null);

  const cargarMensajes = useCallback(async () => {
    if (!receptorId) return;
    
    setCargando(true);
    const mensajesObtenidos = await chatUseCase.obtenerMensajes(receptorId);
    setMensajes(mensajesObtenidos);
    setCargando(false);
  }, [receptorId]);

  const enviarMensaje = useCallback(
    async (contenido: string) => {
      if (!contenido.trim() || !receptorId) {
        return { success: false, error: "Mensaje vacío o sin receptor" };
      }
      
      setEnviando(true);
      const resultado = await chatUseCase.enviarMensaje(contenido, receptorId);
      setEnviando(false);
      return resultado;
    },
    [receptorId]
  );

  const notificarEscritura = useCallback(
    (userEmail: string) => {
      if (!receptorId) return;
      chatUseCase.enviarEventoDeEscritura(userEmail, receptorId);
    },
    [receptorId]
  );

  useEffect(() => {
    if (!receptorId) return;

    cargarMensajes();

    const desuscribir = chatUseCase.suscribirseAMensajes(
      receptorId,
      (nuevoMensaje) => {
        setMensajes((prev) => {
          if (prev.some((m) => m.id === nuevoMensaje.id)) {
            return prev;
          }
          return [...prev, nuevoMensaje];
        });
      },
      (payload) => {
        setQuienEscribe(payload.userEmail);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          setQuienEscribe(null);
        }, 3000) as unknown as number;
      }
    );

    return () => {
      desuscribir();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [cargarMensajes, receptorId]);

  return {
    mensajes,
    cargando,
    enviando,
    quienEscribe,
    enviarMensaje,
    notificarEscritura,
    recargarMensajes: cargarMensajes,
  };
};