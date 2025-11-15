import { supabase } from "@/src/data/services/supabaseClient";
import { Mensaje } from "../../models/Mensaje";
import { RealtimeChannel } from "@supabase/supabase-js";

export class ChatUseCase {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Obtener mensajes entre dos usuarios (conversación 1-a-1)
   */
  async obtenerMensajes(receptorId: string, limite: number = 50): Promise<Mensaje[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("mensajes")
        .select(`
          *,
          emisor:emisor_id(email, nombre, rol)
        `)
        .or(`and(emisor_id.eq.${user.id},receptor_id.eq.${receptorId}),and(emisor_id.eq.${receptorId},receptor_id.eq.${user.id})`)
        .order("created_at", { ascending: true })
        .limit(limite);

      if (error) {
        console.error("Error al obtener mensajes:", error);
        throw error;
      }

      // Marcar como leídos los mensajes recibidos
      await this.marcarComoLeidos(receptorId);

      return (data || []) as Mensaje[];
    } catch (error) {
      console.error("Error al obtener mensajes:", error);
      return [];
    }
  }

  /**
   * Enviar mensaje a un receptor específico
   */
  async enviarMensaje(
    contenido: string,
    receptorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      const { error } = await supabase.from("mensajes").insert({
        contenido,
        emisor_id: user.id,
        receptor_id: receptorId,
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error("Error al enviar mensaje:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Suscribirse a mensajes de una conversación específica
   */
  suscribirseAMensajes(
    receptorId: string,
    callbackMensaje: (mensaje: Mensaje) => void,
    callbackTyping: (payload: { userEmail: string }) => void
  ) {
    const channelName = `chat-${receptorId}`;
    
    // Si ya existe un canal, removerlo primero
    if (this.channels.has(channelName)) {
      const oldChannel = this.channels.get(channelName);
      if (oldChannel) {
        supabase.removeChannel(oldChannel);
      }
    }

    const channel = supabase.channel(channelName);
    this.channels.set(channelName, channel);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes",
        },
        async (payload) => {
          try {
            const nuevoMensaje = payload.new as any;
            
            // Verificar si el mensaje es de esta conversación
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const esParaMi = nuevoMensaje.receptor_id === user.id && nuevoMensaje.emisor_id === receptorId;
            const esMio = nuevoMensaje.emisor_id === user.id && nuevoMensaje.receptor_id === receptorId;

            if (!esParaMi && !esMio) return;

            // Obtener mensaje completo con información del emisor
            const { data, error } = await supabase
              .from("mensajes")
              .select(`
                *,
                emisor:emisor_id(email, nombre, rol)
              `)
              .eq("id", nuevoMensaje.id)
              .single();

            if (error) {
              console.error("Error al obtener mensaje completo:", error);
              return;
            }

            if (data) {
              callbackMensaje(data as Mensaje);
              
              // Si el mensaje es para mí, marcarlo como leído
              if (esParaMi) {
                await this.marcarComoLeidos(receptorId);
              }
            }
          } catch (err) {
            console.error("Error inesperado:", err);
          }
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        callbackTyping(payload.payload);
      })
      .subscribe((status) => {
        console.log(`Estado de suscripción (${channelName}):`, status);
      });

    return () => {
      if (this.channels.has(channelName)) {
        const ch = this.channels.get(channelName);
        if (ch) {
          supabase.removeChannel(ch);
          this.channels.delete(channelName);
        }
      }
    };
  }

  /**
   * Enviar evento de escritura
   */
  async enviarEventoDeEscritura(userEmail: string, receptorId: string) {
    const channelName = `chat-${receptorId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "typing",
        payload: { userEmail },
      });
    }
  }

  /**
   * Eliminar mensaje (solo el emisor puede eliminar sus mensajes)
   */
  async eliminarMensaje(mensajeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from("mensajes").delete().eq("id", mensajeId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error("Error al eliminar mensaje:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Marcar mensajes como leídos
   */
  async marcarComoLeidos(receptorId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("mensajes")
        .update({ leido: true })
        .eq("receptor_id", user.id)
        .eq("emisor_id", receptorId)
        .eq("leido", false);
    } catch (error) {
      console.error("Error al marcar como leídos:", error);
    }
  }

  /**
   * Obtener usuarios disponibles para chatear (según el rol)
   * ESTA ES LA FUNCIÓN CLAVE QUE ESTABA FALTANDO
   */
  async obtenerUsuariosDisponibles(): Promise<Array<{ id: string; email: string; rol: string }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("❌ No hay usuario autenticado");
        return [];
      }

      // Obtener rol del usuario actual
      const { data: usuarioActual, error: errorUsuario } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

      if (errorUsuario || !usuarioActual) {
        console.error("❌ Error al obtener usuario actual:", errorUsuario);
        return [];
      }

      console.log("✅ Usuario actual:", usuarioActual.rol);

      // Si es entrenador, obtener todos los usuarios
      // Si es usuario, obtener todos los entrenadores
      const rolBuscado = usuarioActual.rol === "entrenador" ? "usuario" : "entrenador";

      console.log("🔍 Buscando usuarios con rol:", rolBuscado);

      const { data, error } = await supabase
        .from("usuarios")
        .select("id, email, rol")
        .eq("rol", rolBuscado)
        .order("email", { ascending: true });

      if (error) {
        console.error("❌ Error al buscar usuarios:", error);
        throw error;
      }

      console.log(`✅ Encontrados ${data?.length || 0} usuarios con rol ${rolBuscado}`);
      return data || [];
    } catch (error) {
      console.error("❌ Error al obtener usuarios:", error);
      return [];
    }
  }
}