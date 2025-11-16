import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../../data/services/supabaseClient";
import { EjercicioCompletado, Progreso } from "../../models/Progreso";

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
        planId: string,
        fecha: string,
        ejerciciosCompletados: EjercicioCompletado[],
        duracionReal?: number,
        sensacion?: string,
        notas?: string,
        fotosUris?: string[]
    ) {
        try {
            let fotosUrls: string[] = [];

            if (fotosUris && fotosUris.length > 0) {
                for (const uri of fotosUris) {
                    const url = await this.subirFotoProgreso(uri);
                    if (url) fotosUrls.push(url);
                }
            }

            const { data, error } = await supabase
                .from("progreso")
                .insert({
                    usuario_id: usuarioId,
                    plan_id: planId,
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

    private async subirFotoProgreso(uri: string): Promise<string | null> {
        try {
            const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
            const nombreArchivo = `progreso/${Date.now()}.${extension}`;

            const response = await fetch(uri);
            const blob = await response.blob();

            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(nombreArchivo, blob, {
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
     * SELECCIONAR FOTOS - Actualizado a nueva API
     */
    async seleccionarFotos(): Promise<string[]> {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                alert("Necesitamos permisos para acceder a tus fotos");
                return [];
            }

            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'], // ✅ Corregido
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
}