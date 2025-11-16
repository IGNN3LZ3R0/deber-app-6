import { Stack } from "expo-router";

export default function ProgresoLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="registrar" />
        </Stack>
    );
}