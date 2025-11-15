import { Stack } from "expo-router";

export default function RutinaLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="crear"
                options={{
                    presentation: "card",
                }}
            />
            <Stack.Screen
                name="editar"
                options={{
                    presentation: "modal",
                }}
            />
            <Stack.Screen
                name="detalle"
                options={{
                    presentation: "card",
                }}
            />
        </Stack>
    );
}