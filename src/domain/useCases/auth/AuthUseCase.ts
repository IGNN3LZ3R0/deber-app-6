import { supabase } from "@/src/data/services/supabaseClient";
import { Usuario } from "../../models/Usuario";

/**
 * AuthUseCase - Caso de Uso de Autenticación
 *
 * Contiene toda la lógica de negocio relacionada con autenticación:
 * - Registro de usuarios
 * - Inicio de sesión
 * - Cierre de sesión
 * - Obtener usuario actual
 * - Escuchar cambios de autenticación
 *
 * Este UseCase es el "cerebro" de la autenticación.
 * Los componentes no hablan directamente con Supabase, sino con este UseCase.
 */
export class AuthUseCase {
    /**
     * Registrar nuevo usuario
     *
     * @param email - Email del usuario
     * @param password - Contraseña (mínimo 6 caracteres)
     * @param rol - Tipo de usuario: "chef" o "usuario"
     * @returns Objeto con success y datos o error
     */
    async registrar(email: string, password: string, rol: "chef" | "usuario") {
        try {
            // PASO 1: Crear usuario en Supabase Auth
            // Esto disparará el trigger en SQL que crea la fila en 'usuarios' con rol 'usuario'
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            // Verificar si hubo error
            if (authError) throw authError;
            if (!authData.user) throw new Error("No se pudo crear el usuario");

            // PASO 2: CORREGIDO - Actualizar el rol del usuario
            // El trigger ya creó la fila con rol 'usuario'.
            // Ahora actualizamos esa fila con el rol que el usuario seleccionó en la app.
            const { error: updateError } = await supabase
                .from("usuarios")
                .update({ rol: rol }) // Solo actualiza el campo 'rol'
                .eq("id", authData.user.id); // Donde el ID coincida

            if (updateError) throw updateError; // Lanzará error si el RLS de UPDATE falla

            return { success: true, user: authData.user };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Iniciar sesión
     *
     * @param email - Email del usuario
     * @param password - Contraseña
     * @returns Objeto con success y datos o error
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
     * Obtener usuario actual con toda su información
     *
     * @returns Usuario completo o null si no hay sesión
     */
    async obtenerUsuarioActual(): Promise<Usuario | null> {
        try {
            // PASO 1: Obtener usuario de Auth
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return null;

            // PASO 2: Obtener información completa de tabla usuarios
            const { data, error } = await supabase
                .from("usuarios")
                .select("*")
                .eq("id", user.id)
                .single(); // Esperamos un solo resultado

            if (error) throw error;
            return data as Usuario;
        } catch (error) {
            console.log("Error al obtener usuario:", error);
            return null;
        }
    }

    /**
     * Escuchar cambios de autenticación
     *
     * Esta función permite reaccionar en tiempo real cuando:
     * - Un usuario inicia sesión
     * - Un usuario cierra sesión
     * - El token expira y se refresca
     *
     * @param callback - Función que se ejecuta cuando hay cambios
     * @returns Suscripción que debe limpiarse al desmontar
     */
    onAuthStateChange(callback: (usuario: Usuario | null) => void) {
        return supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                // Hay sesión activa: obtener datos completos
                const usuario = await this.obtenerUsuarioActual();
                callback(usuario);
            } else {
                // No hay sesión: retornar null
                callback(null);
            }
        });
    }
}