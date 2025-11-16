import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../../data/services/supabaseClient";
import { Ejercicio, Rutina } from "../../models/Rutina";

export class RutinasUseCase {
    private readonly BUCKET_NAME = "fitness-media";

    async obtenerRutinas(): Promise<Rutina[]> {
        try {
            const { data, error } = await supabase
                .from("rutinas")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error al obtener rutinas:", error);
            return [];
        }
    }

    async obtenerRutinaPorId(id: string): Promise<Rutina | null> {
        try {
            const { data, error } = await supabase
                .from("rutinas")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error al obtener rutina:", error);
            return null;
        }
    }

    async buscarPorNivel(nivel: string): Promise<Rutina[]> {
        try {
            const { data, error } = await supabase
                .from("rutinas")
                .select("*")
                .eq("nivel", nivel)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error en búsqueda:", error);
            return [];
        }
    }

    async crearRutina(
        titulo: string,
        descripcion: string,
        ejercicios: Ejercicio[],
        entrenadorId: string,
        nivel: "principiante" | "intermedio" | "avanzado",
        duracionMinutos?: number,
        imagenUri?: string
    ) {
        try {
            let imagenUrl = null;

            if (imagenUri) {
                imagenUrl = await this.subirImagen(imagenUri);
            }

            const { data, error } = await supabase
                .from("rutinas")
                .insert({
                    titulo,
                    descripcion,
                    ejercicios,
                    entrenador_id: entrenadorId,
                    nivel,
                    duracion_minutos: duracionMinutos,
                    imagen_url: imagenUrl,
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, rutina: data };
        } catch (error: any) {
            console.error("Error al crear rutina:", error);
            return { success: false, error: error.message };
        }
    }

    async actualizarRutina(
        id: string,
        titulo: string,
        descripcion: string,
        ejercicios: Ejercicio[],
        nivel: "principiante" | "intermedio" | "avanzado",
        duracionMinutos?: number,
        imagenUri?: string
    ) {
        try {
            const { data: rutinaActual } = await supabase
                .from("rutinas")
                .select("imagen_url")
                .eq("id", id)
                .single();

            let imagenUrl = rutinaActual?.imagen_url;

            if (imagenUri && imagenUri !== rutinaActual?.imagen_url) {
                const nuevaImagenUrl = await this.subirImagen(imagenUri);
                if (nuevaImagenUrl) {
                    if (rutinaActual?.imagen_url) {
                        await this.eliminarImagen(rutinaActual.imagen_url);
                    }
                    imagenUrl = nuevaImagenUrl;
                }
            }

            const { data, error } = await supabase
                .from("rutinas")
                .update({
                    titulo,
                    descripcion,
                    ejercicios,
                    nivel,
                    duracion_minutos: duracionMinutos,
                    imagen_url: imagenUrl,
                })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return { success: true, rutina: data };
        } catch (error: any) {
            console.error("Error al actualizar rutina:", error);
            return { success: false, error: error.message };
        }
    }

    async eliminarRutina(id: string, imagenUrl?: string) {
        try {
            if (imagenUrl) {
                await this.eliminarImagen(imagenUrl);
            }

            const { error } = await supabase.from("rutinas").delete().eq("id", id);

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // MÉTODOS DE STORAGE - FORMDATA
    // ========================================

    /**
     * ✅ Subir imagen usando FormData (compatible con React Native)
     */
    private async subirImagen(uri: string): Promise<string | null> {
        try {
            const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
            const nombreArchivo = `rutinas/${Date.now()}.${extension}`;

            // Crear FormData para React Native
            const formData = new FormData();
            formData.append('file', {
                uri: uri,
                name: nombreArchivo,
                type: `image/${extension}`,
            } as any);

            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(nombreArchivo, formData, {
                    contentType: `image/${extension}`,
                    cacheControl: "3600",
                });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(nombreArchivo);

            return urlData.publicUrl;
        } catch (error) {
            console.error("Error al subir imagen:", error);
            return null;
        }
    }

    /**
     * ✅ Subir video usando FormData (compatible con React Native)
     */
    async subirVideo(uri: string): Promise<string | null> {
        try {
            const extension = uri.split(".").pop()?.toLowerCase() || "mp4";
            const nombreArchivo = `videos/${Date.now()}.${extension}`;

            // Crear FormData para React Native
            const formData = new FormData();
            formData.append('file', {
                uri: uri,
                name: nombreArchivo,
                type: `video/${extension}`,
            } as any);

            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(nombreArchivo, formData, {
                    contentType: `video/${extension}`,
                    cacheControl: "3600",
                });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(nombreArchivo);

            return urlData.publicUrl;
        } catch (error) {
            console.error("Error al subir video:", error);
            return null;
        }
    }

    /**
     * Eliminar imagen del bucket
     */
    private async eliminarImagen(url: string): Promise<void> {
        try {
            const nombreArchivo = url.split("/").pop();
            if (!nombreArchivo) return;

            await supabase.storage.from(this.BUCKET_NAME).remove([`rutinas/${nombreArchivo}`]);
        } catch (error) {
            console.warn("Error al eliminar imagen:", error);
        }
    }

    // ========================================
    // MÉTODOS DE IMAGE PICKER
    // ========================================

    /**
     * Seleccionar imagen de galería
     */
    async seleccionarImagen(): Promise<string | null> {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                alert("Necesitamos permisos para acceder a tus fotos");
                return null;
            }

            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!resultado.canceled) {
                return resultado.assets[0].uri;
            }
            return null;
        } catch (error) {
            console.error("Error al seleccionar imagen:", error);
            return null;
        }
    }

    /**
     * Tomar foto con cámara
     */
    async tomarFoto(): Promise<string | null> {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
                alert("Necesitamos permisos para acceder a la cámara");
                return null;
            }

            const resultado = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!resultado.canceled) {
                return resultado.assets[0].uri;
            }
            return null;
        } catch (error) {
            console.error("Error al tomar foto:", error);
            return null;
        }
    }

    /**
     * Seleccionar video de galería
     */
    async seleccionarVideo(): Promise<string | null> {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                alert("Necesitamos permisos para acceder a tus videos");
                return null;
            }

            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['videos'],
                allowsEditing: true,
                quality: 0.8,
            });

            if (!resultado.canceled) {
                return resultado.assets[0].uri;
            }
            return null;
        } catch (error) {
            console.error("Error al seleccionar video:", error);
            return null;
        }
    }

    /**
     * Grabar video con cámara
     */
    async grabarVideo(): Promise<string | null> {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
                alert("Necesitamos permisos para acceder a la cámara");
                return null;
            }

            const resultado = await ImagePicker.launchCameraAsync({
                mediaTypes: ['videos'],
                allowsEditing: true,
                quality: 0.8,
                videoMaxDuration: 60,
            });

            if (!resultado.canceled) {
                return resultado.assets[0].uri;
            }
            return null;
        } catch (error) {
            console.error("Error al grabar video:", error);
            return null;
        }
    }
}