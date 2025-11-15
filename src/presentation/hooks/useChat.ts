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

  // Cargar mensajes (solo cuando SÍ hay receptorId)
  const cargarMensajes = useCallback(async () => {
    if (!receptorId) return;
    
    setCargando(true);
    const mensajesObtenidos = await chatUseCase.obtenerMensajes(receptorId);
    setMensajes(mensajesObtenidos);
    setCargando(false);
  }, [receptorId]);

  // Obtener usuarios disponibles para nueva conversación
  const obtenerUsuariosDisponibles = useCallback(async () => {
    return await chatUseCase.obtenerUsuariosDisponibles();
  }, []);

  // Enviar mensaje
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

  // Notificar que el usuario está escribiendo
  const notificarEscritura = useCallback(
    (userEmail: string) => {
      if (!receptorId) return;
      chatUseCase.enviarEventoDeEscritura(userEmail, receptorId);
    },
    [receptorId]
  );

  // Effect: Cargar mensajes cuando hay receptorId
  useEffect(() => {
    if (receptorId) {
      cargarMensajes();
    } else {
      // Si no hay receptor, simplemente marcar como no cargando
      setCargando(false);
    }
  }, [receptorId, cargarMensajes]);

  // Effect: Suscribirse a mensajes en tiempo real (solo cuando hay receptorId)
  useEffect(() => {
    if (!receptorId) return;

    const desuscribir = chatUseCase.suscribirseAMensajes(
      receptorId,
      (nuevoMensaje) => {
        setMensajes((prev) => {
          // Evitar duplicados
          if (prev.some((m) => m.id === nuevoMensaje.id)) {
            return prev;
          }
          return [...prev, nuevoMensaje];
        });
      },
      (payload) => {
        setQuienEscribe(payload.userEmail);

        // Limpiar el indicador de escritura después de 3 segundos
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
  }, [receptorId]);

  return {
    // Estados
    mensajes,
    cargando,
    enviando,
    quienEscribe,
    
    // Métodos
    enviarMensaje,
    notificarEscritura,
    obtenerUsuariosDisponibles,
    recargarMensajes: cargarMensajes,
  };
};