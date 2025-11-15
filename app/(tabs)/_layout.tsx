import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/styles/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 1. IMPORTA 'useAuth' Y 'Alert'
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { Alert } from "react-native";

export default function TabLayout() {
    // 1. Importamos el router para poder navegar
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // 2. OBTÉN EL ESTADO DE 'esChef'
    const { esChef } = useAuth();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.primary, // Usamos tu color primario [cite: 90]
                headerShown: false,
                tabBarStyle: {
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingTop: 8,
                },
            }}
        >
            <Tabs.Screen
                name="index" // Esto enlaza con app/(tabs)/index.tsx
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? "home" : "home-outline"}
                            size={28}
                            color={color}
                        />
                    ),
                }}
            />

            {/* ESTA ES LA CORRECCIÓN CLAVE
        El Taller la nombra 'explore', pero no necesita un archivo.
      */}
            <Tabs.Screen
                name="explore"
                options={{
                    title: "Nueva Receta",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? "add-circle" : "add-circle-outline"}
                            size={28}
                            color={color}
                        />
                    ),
                }}
                // 3. APLICA LA LÓGICA DE VERIFICACIÓN AQUÍ
                listeners={{
                    tabPress: (e) => {
                        // Siempre prevenimos la navegación por defecto
                        e.preventDefault();

                        // 4. VERIFICA EL PERMISO
                        if (esChef) {
                            // Si es Chef, navega al modal
                            router.push("/recipe/crear");
                        } else {
                            // Si no es Chef, muestra una alerta
                            Alert.alert(
                                "Acceso Denegado",
                                "Solo los chefs pueden crear nuevas recetas."
                            );
                        }
                    },
                }}
            />

            <Tabs.Screen
                name="chat" // Debe coincidir con tu nombre de archivo: chat.tsx
                options={{
                    title: "Chat",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
                            size={28}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}