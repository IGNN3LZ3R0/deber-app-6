import { useState, useEffect, useCallback, useRef } from "react";
import { ChatUseCase } from "@/src/domain/useCases/chat/ChatUseCase";
import { Mensaje } from "@/src/domain/models/Mensaje";

const chatUseCase = new ChatUseCase();

export const useChat = () => {
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [cargando, setCargando] = useState(true);
    const [enviando, setEnviando] = useState(false);

    const [quienEscribe, setQuienEscribe] = useState<string | null>(null);

    // --- ESTA ES LA LÍNEA CORREGIDA ---
    // En React Native, el 'setTimeout' devuelve un 'number', no un 'NodeJS.Timeout'
    const typingTimeoutRef = useRef<number | null>(null);
    // ---------------------------------

    // Cargar mensajes históricos
    const cargarMensajes = useCallback(async () => {
        setCargando(true);
        const mensajesObtenidos = await chatUseCase.obtenerMensajes();
        setMensajes(mensajesObtenidos);
        setCargando(false);
    }, []);

    // Enviar mensaje
    const enviarMensaje = useCallback(async (contenido: string) => {
        if (!contenido.trim()) return { success: false, error: "El mensaje está vacío" };
        setEnviando(true);
        const resultado = await chatUseCase.enviarMensaje(contenido);
        setEnviando(false);
        return resultado;
    }, []);

    // (Reto 1) Eliminar mensaje
    const eliminarMensaje = useCallback(async (mensajeId: string) => {
        const resultado = await chatUseCase.eliminarMensaje(mensajeId);
        if (resultado.success) {
            setMensajes(prev => prev.filter(m => m.id !== mensajeId));
        }
        return resultado;
    }, []);

    // (Reto 2) Notificar escritura
    const notificarEscritura = useCallback((userEmail: string) => {
        chatUseCase.enviarEventoDeEscritura(userEmail);
    }, []);

    // Suscribirse a mensajes en tiempo real
    useEffect(() => {
        // Cargar mensajes iniciales
        cargarMensajes();

        const desuscribir = chatUseCase.suscribirseAMensajes(
            // Callback para nuevos mensajes (igual que antes)
            (nuevoMensaje) => {
                setMensajes(prev => {
                    if (prev.some(m => m.id === nuevoMensaje.id)) {
                        return prev;
                    }
                    return [...prev, nuevoMensaje];
                });
            },
            // Callback para eventos de escritura (Reto 2)
            (payload) => {
                setQuienEscribe(payload.userEmail);

                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }

                // La línea que daba error ahora es válida,
                // porque 'setTimeout' devuelve 'number'
                typingTimeoutRef.current = setTimeout(() => {
                    setQuienEscribe(null);
                }, 3000);
            }
        );

        // Limpiar suscripción y temporizador al desmontar
        return () => {
            desuscribir();
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [cargarMensajes]);

    return {
        mensajes,
        cargando,
        enviando,
        quienEscribe, // (Reto 2)
        enviarMensaje,
        eliminarMensaje,
        notificarEscritura, // (Reto 2)
        recargarMensajes: cargarMensajes,
    };
};