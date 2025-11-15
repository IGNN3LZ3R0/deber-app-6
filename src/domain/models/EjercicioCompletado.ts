export interface EjercicioCompletado extends Ejercicio {
  series_completadas: number;
  repeticiones_reales: string;
  peso_usado?: string;
}