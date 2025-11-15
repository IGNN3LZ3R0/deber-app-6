import { supabase } from "@/src/data/services/supabaseClient";
import { Mensaje } from "../../models/Mensaje";
import { RealtimeChannel } from "@supabase/supabase-js";

export class ChatUseCase {
    private channel: RealtimeChannel | null = null;

    // --- OBTENER MENSAJES (Sin cambios) ---
    async obtenerMensajes(limite: number = 50): Promise<Mensaje[]> {
        try {
            const { data, error } = await supabase
                .from("mensajes")
                .select(`
          *,
          usuarios!fk_usuario(email, rol)
        `)
                .order("created_at", { ascending: false })
                .limit(limite);

            if (error) {
                console.error("Error al obtener mensajes:", error);
                throw error;
            }

            const mensajesFormateados = (data || []).map((msg: any) => ({
                ...msg,
                usuario: msg.usuarios // Renombrar usuarios a usuario
            }));

            return mensajesFormateados.reverse() as Mensaje[];
        } catch (error) {
            console.error("Error al obtener mensajes:", error);
            return [];
        }
    }

    // --- ENVIAR MENSAJE (Sin cambios) ---
    async enviarMensaje(contenido: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, error: "Usuario no autenticado" };
            }
            const { error } = await supabase
                .from("mensajes")
                .insert({
                    contenido,
                    usuario_id: user.id,
                });

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error("Error al enviar mensaje:", error);
            return { success: false, error: error.message };
        }
    }

    // ---
    // --- ESTA ES LA FUNCIÓN CORREGIDA ---
    // ---
    /**
     * Suscribirse a nuevos mensajes Y eventos de escritura
     */
    suscribirseAMensajes(
        callbackMensaje: (mensaje: Mensaje) => void,
        callbackTyping: (payload: { userEmail: string }) => void
    ) {
        // Crear canal único para esta suscripción
        this.channel = supabase.channel('mensajes-channel');

        this.channel
            // 1. EL LISTENER DE NUEVOS MENSAJES (EL QUE SE ROMPIÓ)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'mensajes'
                },
                async (payload) => {
                    console.log('📨 Nuevo mensaje recibido!', payload.new);
                    try {
                        // (Esta es la lógica original del Taller 8 que restaura el mensaje)
                        const { data, error } = await supabase
                            .from("mensajes")
                            .select(`
                *,
                usuarios!fk_usuario(email, rol)
              `)
                            .eq('id', payload.new.id)
                            .single();

                        if (error) {
                            console.error('⚠️ Error al obtener mensaje completo:', error);
                            return; // Salir si hay error
                        }

                        if (data) {
                            // Formatear el mensaje
                            const mensajeFormateado: Mensaje = {
                                id: data.id,
                                contenido: data.contenido,
                                usuario_id: data.usuario_id,
                                created_at: data.created_at,
                                usuario: data.usuarios || { email: 'Desconocido', rol: 'usuario' }
                            };
                            // ¡LLAMAR AL CALLBACK!
                            callbackMensaje(mensajeFormateado);
                        }
                    } catch (err) {
                        console.error('❌ Error inesperado:', err);
                    }
                }
            )
            // 2. EL LISTENER DEL INDICADOR DE ESCRITURA (El que añadimos)
            .on(
                'broadcast',
                { event: 'typing' },
                (payload) => {
                    callbackTyping(payload.payload);
                }
            )
            .subscribe((status) => {
                console.log('Estado de suscripción:', status);
            });

        // Retornar función para desuscribirse
        return () => {
            if (this.channel) {
                supabase.removeChannel(this.channel);
                this.channel = null;
            }
        };
    }

    // --- ENVIAR EVENTO DE ESCRITURA (Sin cambios) ---
    async enviarEventoDeEscritura(userEmail: string) {
        if (this.channel) {
            this.channel.send({
                type: 'broadcast',
                event: 'typing',
                payload: { userEmail: userEmail },
            });
        }
    }

    // --- ELIMINAR MENSAJE (Sin cambios) ---
    async eliminarMensaje(mensajeId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from("mensajes")
                .delete()
                .eq('id', mensajeId);

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error("Error al eliminar mensaje:", error);
            return { success: false, error: error.message };
        }
    }
}