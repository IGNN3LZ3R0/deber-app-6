import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-url-polyfill/auto";

/**
 * Cliente de Supabase con persistencia de sesión
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "ERROR: Faltan variables de entorno.\n\n" +
    "Asegúrate de tener un archivo .env con:\n" +
    "- EXPO_PUBLIC_SUPABASE_URL\n" +
    "- EXPO_PUBLIC_SUPABASE_ANON_KEY\n\n" +
    "Revisa .env.example para ver el formato correcto."
  );
}

/**
 * Crear cliente de Supabase con AsyncStorage para persistir sesión
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // CAMBIO PRINCIPAL: Usar AsyncStorage para persistir sesión
    storage: AsyncStorage,
    
    // Refrescar token automáticamente
    autoRefreshToken: true,
    
    // ACTIVAR persistencia de sesión
    persistSession: true,
    
    // NO detectar sesión en URL
    detectSessionInUrl: false,
  },
});