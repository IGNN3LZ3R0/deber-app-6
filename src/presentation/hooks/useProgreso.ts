import { useEffect, useState } from "react";
import { Progreso } from "../../domain/models/Progreso";
import { ProgresoUseCase } from "../../domain/useCases/progreso/ProgresoUseCase";

const progresoUseCase = new ProgresoUseCase();

export function useProgreso(usuarioId?: string) {
  const [progresos, setProgresos] = useState<Progreso[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (usuarioId) {
      cargarProgreso();
    }
  }, [usuarioId]);

  const cargarProgreso = async () => {
    if (!usuarioId) return;
    
    setCargando(true);
    const data = await progresoUseCase.obtenerProgresoPorUsuario(usuarioId);
    setProgresos(data);
    setCargando(false);
  };

  const registrar = async (
    rutinaId: string, // ✅ Cambio: ahora es rutinaId en lugar de planId
    fecha: string,
    ejerciciosCompletados: any[],
    duracionReal?: number,
    sensacion?: string,
    notas?: string,
    fotosUris?: string[]
  ) => {
    if (!usuarioId) return { success: false, error: "Usuario no definido" };

    const resultado = await progresoUseCase.registrarProgreso(
      usuarioId,
      rutinaId, // ✅ Pasar rutinaId
      fecha,
      ejerciciosCompletados,
      duracionReal,
      sensacion,
      notas,
      fotosUris
    );

    if (resultado.success) {
      await cargarProgreso();
    }

    return resultado;
  };

  const seleccionarFotos = async () => {
    return await progresoUseCase.seleccionarFotos();
  };

  const tomarFoto = async () => {
    return await progresoUseCase.tomarFoto();
  };

  return {
    progresos,
    cargando,
    cargarProgreso,
    registrar,
    seleccionarFotos,
    tomarFoto, // ✅ Exportar método nuevo
  };
}