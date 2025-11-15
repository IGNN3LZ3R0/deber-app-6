import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/styles/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { Alert } from "react-native";

export default function TabLayout() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { esEntrenador } = useAuth();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.primary,
                headerShown: false,
                tabBarStyle: {
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingTop: 8,
                },
            }}
        >
            {/* TAB 1: RUTINAS / HOME */}
            <Tabs.Screen
                name="index"
                options={{
                    title: "Rutinas",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? "barbell" : "barbell-outline"}
                            size={28}
                            color={color}
                        />
                    ),
                }}
            />

            {/* TAB 2: PROGRESO O CREAR RUTINA (según el rol) */}
            <Tabs.Screen
                name="explore"
                options={{
                    title: esEntrenador ? "Nueva Rutina" : "Mi Progreso",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={
                                esEntrenador
                                    ? focused
                                        ? "add-circle"
                                        : "add-circle-outline"
                                    : focused
                                    ? "trending-up"
                                    : "trending-up-outline"
                            }
                            size={28}
                            color={color}
                        />
                    ),
                }}
                listeners={
                    esEntrenador
                        ? {
                              // Si es entrenador, interceptar el clic
                              tabPress: (e) => {
                                  e.preventDefault();
                                  router.push("/rutina/crear");
                              },
                          }
                        : undefined // Si es usuario, navegación normal
                }
            />

            {/* TAB 3: CHAT */}
            <Tabs.Screen
                name="chat"
                options={{
                    title: "Chat",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={
                                focused
                                    ? "chatbubble-ellipses"
                                    : "chatbubble-ellipses-outline"
                            }
                            size={28}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}