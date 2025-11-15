import { supabase } from "@/src/data/services/supabaseClient";
import { Usuario } from "../../models/Usuario";

export class AuthUseCase {
    /**
     * Registrar nuevo usuario con rol correcto
     */
    async registrar(email: string, password: string, rol: "chef" | "usuario") {
        try {
            // PASO 1: Crear usuario en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    // SOLUCIÓN: Pasar el rol en los metadata del usuario
                    data: {
                        rol: rol
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("No se pudo crear el usuario");

            // PASO 2: Esperar un momento para que el trigger cree la fila
            await new Promise(resolve => setTimeout(resolve, 100));

            // PASO 3: Actualizar el rol en la tabla usuarios
            const { error: updateError } = await supabase
                .from("usuarios")
                .update({ rol: rol })
                .eq("id", authData.user.id);

            if (updateError) {
                console.warn("⚠️ Error al actualizar rol:", updateError);
                // No lanzar error, el usuario se creó correctamente
            }

            return { success: true, user: authData.user };
        } catch (error: any) {
            console.error("❌ Error en registro:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Iniciar sesión
     */
    async iniciarSesion(email: string, password: string) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Cerrar sesión
     */
    async cerrarSesion() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtener usuario actual con información completa
     */
    async obtenerUsuarioActual(): Promise<Usuario | null> {
        try {
            // PASO 1: Obtener usuario de Auth
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) return null;

            // PASO 2: Obtener información de la tabla usuarios
            const { data, error } = await supabase
                .from("usuarios")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) {
                console.warn("⚠️ Error al obtener usuario de tabla:", error);
                // Retornar usuario básico si falla la consulta
                return {
                    id: user.id,
                    email: user.email || "",
                    rol: "usuario"
                };
            }

            return data as Usuario;
        } catch (error) {
            console.log("Error al obtener usuario:", error);
            return null;
        }
    }

    /**
     * Escuchar cambios de autenticación
     */
    onAuthStateChange(callback: (usuario: Usuario | null) => void) {
        return supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const usuario = await this.obtenerUsuarioActual();
                callback(usuario);
            } else {
                callback(null);
            }
        });
    }
}