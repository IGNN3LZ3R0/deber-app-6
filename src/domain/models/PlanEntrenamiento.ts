export interface PlanEntrenamiento {
  id: string;
  usuario_id: string;
  rutina_id: string;
  entrenador_id: string;
  fecha_inicio: string; // ISO date
  fecha_fin?: string;
  dias_semana: string[]; // ['lunes', 'miércoles', 'viernes']
  notas?: string;
  activo: boolean;
  created_at: string;
  // Datos relacionados (joins)
  rutina?: Rutina;
  usuario?: Usuario;
}