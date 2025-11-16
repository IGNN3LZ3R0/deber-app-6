// src/presentation/hooks/useRutinas.ts
import { useEffect, useState } from "react";
import { Rutina } from "../../domain/models/Rutina";
import { RutinasUseCase } from "../../domain/useCases/rutinas/RutinasUseCase";

const rutinasUseCase = new RutinasUseCase();

export function useRutinas() {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarRutinas();
  }, []);

  const cargarRutinas = async () => {
    setCargando(true);
    const data = await rutinasUseCase.obtenerRutinas();
    setRutinas(data);
    setCargando(false);
  };

  const buscarPorNivel = async (nivel: string) => {
    setCargando(true);
    const data = await rutinasUseCase.buscarPorNivel(nivel);
    setRutinas(data);
    setCargando(false);
  };

  const crear = async (
    titulo: string,
    descripcion: string,
    ejercicios: any[],
    entrenadorId: string,
    nivel: "principiante" | "intermedio" | "avanzado",
    duracionMinutos?: number,
    imagenUri?: string
  ) => {
    const resultado = await rutinasUseCase.crearRutina(
      titulo,
      descripcion,
      ejercicios,
      entrenadorId,
      nivel,
      duracionMinutos,
      imagenUri
    );

    if (resultado.success) {
      await cargarRutinas();
    }

    return resultado;
  };

  const actualizar = async (
    id: string,
    titulo: string,
    descripcion: string,
    ejercicios: any[],
    nivel: "principiante" | "intermedio" | "avanzado",
    duracionMinutos?: number,
    imagenUri?: string
  ) => {
    const resultado = await rutinasUseCase.actualizarRutina(
      id,
      titulo,
      descripcion,
      ejercicios,
      nivel,
      duracionMinutos,
      imagenUri
    );
    if (resultado.success) {
      await cargarRutinas();
    }
    return resultado;
  };

  const eliminar = async (id: string) => {
    const rutina = rutinas.find((r) => r.id === id);
    const resultado = await rutinasUseCase.eliminarRutina(id, rutina?.imagen_url);

    if (resultado.success) {
      await cargarRutinas();
    }

    return resultado;
  };

  // ✅ MÉTODOS NUEVOS
  const seleccionarImagen = async () => {
    return await rutinasUseCase.seleccionarImagen();
  };

  const tomarFoto = async () => {
    return await rutinasUseCase.tomarFoto();
  };

  const seleccionarVideo = async () => {
    return await rutinasUseCase.seleccionarVideo();
  };

  const grabarVideo = async () => {
    return await rutinasUseCase.grabarVideo();
  };

  const subirVideo = async (uri: string) => {
    return await rutinasUseCase.subirVideo(uri);
  };

  return {
    rutinas,
    cargando,
    cargarRutinas,
    buscarPorNivel,
    crear,
    actualizar,
    eliminar,
    seleccionarImagen,
    tomarFoto,        // ✅ Nuevo
    seleccionarVideo,
    grabarVideo,      // ✅ Nuevo
    subirVideo,
  };
}