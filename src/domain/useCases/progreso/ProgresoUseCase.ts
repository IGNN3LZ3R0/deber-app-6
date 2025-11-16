import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../../data/services/supabaseClient";
import { EjercicioCompletado } from "../../models/EjercicioCompletado";
import { Progreso } from "../../models/Progreso";

export class ProgresoUseCase {
    private readonly BUCKET_NAME = "fitness-media";

    async obtenerProgresoPorUsuario(usuarioId: string): Promise<Progreso[]> {
        try {
            const { data, error } = await supabase
                .from("progreso")
                .select("*")
                .eq("usuario_id", usuarioId)
                .order("fecha", { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error al obtener progreso:", error);
            return [];
        }
    }

    async registrarProgreso(
        usuarioId: string,
        rutinaId: string, // ✅ Ahora usa rutinaId en lugar de planId
        fecha: string,
        ejerciciosCompletados: EjercicioCompletado[],
        duracionReal?: number,
        sensacion?: string,
        notas?: string,
        fotosUris?: string[]
    ) {
        try {
            let fotosUrls: string[] = [];

            // Subir fotos si existen
            if (fotosUris && fotosUris.length > 0) {
                for (const uri of fotosUris) {
                    const url = await this.subirFotoProgreso(uri);
                    if (url) fotosUrls.push(url);
                }
            }

            // ✅ Intentar crear plan automáticamente
            let planId = null;
            
            try {
                const { data: planData, error: planError } = await supabase
                    .rpc('crear_plan_automatico', {
                        p_usuario_id: usuarioId,
                        p_rutina_id: rutinaId
                    });

                if (!planError && planData) {
                    planId = planData;
                }
            } catch (err) {
                console.warn("No se pudo crear plan automático, usando rutina_id directamente:", err);
            }

            // Insertar progreso (con plan_id si existe, o solo rutina_id)
            const { data, error } = await supabase
                .from("progreso")
                .insert({
                    usuario_id: usuarioId,
                    plan_id: planId, // Puede ser null
                    rutina_id: rutinaId, // ✅ Siempre incluir rutina_id
                    fecha,
                    ejercicios_completados: ejerciciosCompletados,
                    duracion_real_minutos: duracionReal,
                    sensacion,
                    notas,
                    fotos_progreso: fotosUrls.length > 0 ? fotosUrls : null,
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, progreso: data };
        } catch (error: any) {
            console.error("Error al registrar progreso:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Subir foto usando FormData
     */
    private async subirFotoProgreso(uri: string): Promise<string | null> {
        try {
            const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
            const nombreArchivo = `progreso/${Date.now()}.${extension}`;

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
                });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(nombreArchivo);

            return urlData.publicUrl;
        } catch (error) {
            console.error("Error al subir foto:", error);
            return null;
        }
    }

    /**
     * Seleccionar múltiples fotos de galería
     */
    async seleccionarFotos(): Promise<string[]> {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                alert("Necesitamos permisos para acceder a tus fotos");
                return [];
            }

            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.7,
            });

            if (!resultado.canceled) {
                return resultado.assets.map(asset => asset.uri);
            }
            return [];
        } catch (error) {
            console.error("Error al seleccionar fotos:", error);
            return [];
        }
    }

    /**
     * ✅ NUEVO: Tomar foto con cámara
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
}