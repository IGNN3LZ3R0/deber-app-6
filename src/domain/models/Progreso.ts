export interface Progreso {
  id: string;
  usuario_id: string;
  plan_id: string;
  fecha: string; // ISO date
  ejercicios_completados: EjercicioCompletado[];
  duracion_real_minutos?: number;
  sensacion?: "muy_facil" | "facil" | "moderado" | "dificil" | "muy_dificil";
  notas?: string;
  fotos_progreso?: string[]; // URLs
  created_at: string;
}