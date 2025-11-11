import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../../data/services/supabaseClient";
import { Receta } from "../../models/Receta";

export class RecipesUseCase {
  // Obtener todas las recetas
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

  // Buscar recetas por ingrediente
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

  // Crear nueva receta
  async crearReceta(
    titulo: string,
    descripcion: string,
    ingredientes: string[],
    chefId: string,
    imagenUri?: string
  ) {
    try {
      let imagenUrl = null;

      // Si hay imagen, la subimos primero
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
      return { success: false, error: error.message };
    }
  }

  // Actualizar receta existente (ahora con soporte para cambiar imagen)
  async actualizarReceta(
    id: string,
    titulo: string,
    descripcion: string,
    ingredientes: string[],
    imagenUri?: string,
    imagenUrlAnterior?: string
  ) {
    try {
      let imagenUrl: string | null | undefined = imagenUrlAnterior;

      // Si hay una nueva imagen, la subimos y eliminamos la anterior
      if (imagenUri) {
        // Subir la nueva imagen
        const nuevaImagenUrl = await this.subirImagen(imagenUri);

        // Si se subió correctamente y había una imagen anterior, eliminarla
        if (nuevaImagenUrl && imagenUrlAnterior) {
          await this.eliminarImagen(imagenUrlAnterior);
        }

        imagenUrl = nuevaImagenUrl || imagenUrlAnterior;
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
      return { success: false, error: error.message };
    }
  }

  // Eliminar receta
  async eliminarReceta(id: string, imagenUrl?: string) {
    try {
      // Si la receta tiene imagen, eliminarla del storage
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

  // Subir imagen a Supabase Storage
  private async subirImagen(uri: string): Promise<string | null> {
    try {
      // Obtener la extensión del archivo (sin query params)
      const uriWithoutQuery = uri.split("?")[0];
      const extension = (uriWithoutQuery.split(".").pop() || "jpg").toLowerCase();
      const nombreArchivo = `${Date.now()}.${extension}`;

      // Obtener el contenido del archivo
      const response = await fetch(uri);

      // En React Native/Expo, response.blob() puede no estar disponible.
      // Usamos arrayBuffer() y convertimos a Uint8Array para subir.
      const arrayBuffer = await response.arrayBuffer();
      const fileBody = new Uint8Array(arrayBuffer);

      // Subir a Supabase Storage. supabase-js acepta Blob, ArrayBuffer o Uint8Array.
      const { data, error } = await supabase.storage
        .from("recetas-fotos")
        .upload(nombreArchivo, fileBody, {
          contentType: `image/${extension}`,
        });

      if (error) throw error;

      // Obtener la URL pública
      const { data: urlData } = supabase.storage
        .from("recetas-fotos")
        .getPublicUrl(nombreArchivo);

      return urlData.publicUrl;
    } catch (error) {
      console.log("Error al subir imagen:", error);
      return null;
    }
  }

  // Eliminar imagen del Storage
  private async eliminarImagen(imagenUrl: string): Promise<void> {
    try {
      // Extraer el nombre del archivo de la URL
      const nombreArchivo = imagenUrl.split("/").pop();

      if (!nombreArchivo) return;

      const { error } = await supabase.storage
        .from("recetas-fotos")
        .remove([nombreArchivo]);

      if (error) {
        console.log("Error al eliminar imagen:", error);
      }
    } catch (error) {
      console.log("Error al eliminar imagen:", error);
    }
  }

  // Seleccionar imagen de la galería
  async seleccionarImagen(): Promise<string | null> {
    try {
      // Pedir permisos
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        alert("Necesitamos permisos para acceder a tus fotos");
        return null;
      }

      // Abrir selector de imágenes
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

  // Tomar foto con la cámara
  async tomarFoto(): Promise<string | null> {
    try {
      // Pedir permisos de cámara
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        alert("Necesitamos permisos para acceder a la cámara");
        return null;
      }

      // Abrir la cámara
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