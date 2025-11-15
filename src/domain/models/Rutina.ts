export interface Rutina {
  id: string;
  titulo: string;
  descripcion: string;
  ejercicios: Ejercicio[];
  entrenador_id: string;
  nivel: "principiante" | "intermedio" | "avanzado";
  duracion_minutos?: number;
  imagen_url?: string;
  created_at: string;
}