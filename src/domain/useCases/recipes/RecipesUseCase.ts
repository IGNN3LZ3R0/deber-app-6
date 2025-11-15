import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../../data/services/supabaseClient";
import { Receta } from "../../models/Receta";

export class RecipesUseCase {
  // Nombre del bucket (VERIFICA QUE EXISTA EN SUPABASE)
  private readonly BUCKET_NAME = "recetas";

  async obtenerRecetas(): Promise<Receta[]> {
    try {
      const { data, error } = await supabase
        .from("recetas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log("Error al obtener recetas:", error);
      return [];
    }
  }

  async buscarPorIngrediente(ingrediente: string): Promise<Receta[]> {
    try {
      const { data, error } = await supabase
        .from("recetas")
        .select("*")
        .contains("ingredientes", [ingrediente])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log("Error en búsqueda:", error);
      return [];
    }
  }

  async crearReceta(
    titulo: string,
    descripcion: string,
    ingredientes: string[],
    chefId: string,
    imagenUri?: string
  ) {
    try {
      let imagenUrl = null;

      if (imagenUri) {
        imagenUrl = await this.subirImagen(imagenUri);
      }

      const { data, error } = await supabase
        .from("recetas")
        .insert({
          titulo,
          descripcion,
          ingredientes,
          chef_id: chefId,
          imagen_url: imagenUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, receta: data };
    } catch (error: any) {
      console.error("❌ Error al crear receta:", error);
      return { success: false, error: error.message };
    }
  }

  async actualizarReceta(
    id: string,
    titulo: string,
    descripcion: string,
    ingredientes: string[],
    imagenUri?: string
  ) {
    try {
      // Obtener la receta actual para conocer su imagen
      const { data: recetaActual } = await supabase
        .from("recetas")
        .select("imagen_url")
        .eq("id", id)
        .single();

      let imagenUrl: string | null | undefined = recetaActual?.imagen_url;

      // Si hay nueva imagen, subirla
      if (imagenUri) {
        const nuevaImagenUrl = await this.subirImagen(imagenUri);
        
        if (nuevaImagenUrl) {
          // Eliminar imagen anterior si existe
          if (recetaActual?.imagen_url) {
            await this.eliminarImagen(recetaActual.imagen_url);
          }
          imagenUrl = nuevaImagenUrl;
        }
      }

      const { data, error } = await supabase
        .from("recetas")
        .update({
          titulo,
          descripcion,
          ingredientes,
          imagen_url: imagenUrl,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, receta: data };
    } catch (error: any) {
      console.error("❌ Error al actualizar receta:", error);
      return { success: false, error: error.message };
    }
  }

  async eliminarReceta(id: string, imagenUrl?: string) {
    try {
      if (imagenUrl) {
        await this.eliminarImagen(imagenUrl);
      }

      const { error } = await supabase.from("recetas").delete().eq("id", id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * SUBIR IMAGEN - Método corregido
   */
  private async subirImagen(uri: string): Promise<string | null> {
    try {
      console.log("📤 Subiendo imagen...");

      // Obtener extensión
      const uriWithoutQuery = uri.split("?")[0];
      const extension = (uriWithoutQuery.split(".").pop() || "jpg").toLowerCase();
      const nombreArchivo = `${Date.now()}.${extension}`;

      // Obtener contenido del archivo
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const fileBody = new Uint8Array(arrayBuffer);

      console.log(`📦 Archivo: ${nombreArchivo}, Tamaño: ${fileBody.length} bytes`);

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(nombreArchivo, fileBody, {
          contentType: `image/${extension}`,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("❌ Error de Storage:", error);
        throw error;
      }

      console.log("✅ Imagen subida correctamente");

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(nombreArchivo);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error("❌ Error al subir imagen:", error.message);
      return null;
    }
  }

  /**
   * ELIMINAR IMAGEN
   */
  private async eliminarImagen(imagenUrl: string): Promise<void> {
    try {
      const nombreArchivo = imagenUrl.split("/").pop();
      if (!nombreArchivo) return;

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([nombreArchivo]);

      if (error) {
        console.warn("⚠️ Error al eliminar imagen:", error);
      }
    } catch (error) {
      console.warn("⚠️ Error al eliminar imagen:", error);
    }
  }

  /**
   * SELECCIONAR IMAGEN DE GALERÍA
   */
  async seleccionarImagen(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        alert("Necesitamos permisos para acceder a tus fotos");
        return null;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!resultado.canceled) {
        return resultado.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.log("Error al seleccionar imagen:", error);
      return null;
    }
  }

  /**
   * TOMAR FOTO CON CÁMARA
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
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!resultado.canceled) {
        return resultado.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.log("Error al tomar foto:", error);
      return null;
    }
  }
}