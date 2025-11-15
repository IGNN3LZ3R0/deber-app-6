import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { useRutinas } from "../../src/presentation/hooks/useRutinas";
import { globalStyles } from "../../src/styles/globalStyles";
import {
    borderRadius,
    colors,
    fontSize,
    spacing,
} from "../../src/styles/theme";

import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function HomeScreen() {
    const { usuario, cerrarSesion, esEntrenador } = useAuth();
    const { rutinas, cargando, cargarRutinas, buscarPorNivel, eliminar } = useRutinas();
    const [busqueda, setBusqueda] = useState("");
    const [refrescando, setRefrescando] = useState(false);
    const router = useRouter();

    const handleBuscar = () => {
        if (busqueda.trim()) {
            const nivelBusqueda = busqueda.trim().toLowerCase();
            if (["principiante", "intermedio", "avanzado"].includes(nivelBusqueda)) {
                buscarPorNivel(nivelBusqueda);
            } else {
                Alert.alert(
                    "Búsqueda por Nivel",
                    "Ingresa: principiante, intermedio o avanzado"
                );
            }
        } else {
            cargarRutinas();
        }
    };

    const handleRefresh = async () => {
        setRefrescando(true);
        await cargarRutinas();
        setRefrescando(false);
    };

    const handleCerrarSesion = async () => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro de que quieres salir?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Salir",
                    style: "destructive",
                    onPress: async () => {
                        await cerrarSesion();
                        router.replace("/auth/login");
                    },
                },
            ]
        );
    };

    const handleEliminar = (rutinaId: string) => {
        Alert.alert(
            "Confirmar eliminación",
            "¿Estás seguro de que quieres eliminar esta rutina? Esta acción no se puede deshacer.",
            [
                {
                    text: "Cancelar",
                    style: "cancel",
                },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        const resultado = await eliminar(rutinaId);
                        if (resultado.success) {
                            Alert.alert("Éxito", "Rutina eliminada correctamente");
                        } else {
                            Alert.alert("Error", resultado.error || "No se pudo eliminar");
                        }
                    },
                },
            ]
        );
    };

    const renderNivelBadge = (nivel: string) => {
        let colorNivel = colors.success;
        let iconoNivel = "fitness-outline";

        if (nivel === "intermedio") {
            colorNivel = colors.warning;
            iconoNivel = "barbell-outline";
        } else if (nivel === "avanzado") {
            colorNivel = colors.danger;
            iconoNivel = "flame-outline";
        }

        return (
            <View style={[styles.badgeNivel, { backgroundColor: colorNivel + "20" }]}>
                <Ionicons name={iconoNivel as any} size={14} color={colorNivel} />
                <Text style={[styles.textoNivel, { color: colorNivel }]}>
                    {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
                </Text>
            </View>
        );
    };

    if (!usuario) {
        return (
            <View style={globalStyles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={globalStyles.container}>
            {/* HEADER */}
            <View style={globalStyles.header}>
                <View>
                    <Text style={styles.saludo}>¡Hola, {usuario.nombre || "Atleta"}!</Text>
                    <Text style={globalStyles.textSecondary}>{usuario.email}</Text>
                    <View style={styles.rolContainer}>
                        <Ionicons
                            name={esEntrenador ? "barbell" : "person"}
                            size={14}
                            color={colors.primary}
                        />
                        <Text style={styles.rol}>
                            {esEntrenador ? " Entrenador" : " Usuario"}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[
                        globalStyles.button,
                        globalStyles.buttonDanger,
                        styles.botonCerrar,
                    ]}
                    onPress={handleCerrarSesion}
                >
                    <Ionicons name="log-out-outline" size={18} color={colors.white} />
                    <Text style={globalStyles.buttonText}> Salir</Text>
                </TouchableOpacity>
            </View>

            {/* BARRA DE BÚSQUEDA */}
            <View style={styles.contenedorBusqueda}>
                <TextInput
                    style={[globalStyles.input, styles.inputBusqueda]}
                    placeholder="Buscar por nivel (principiante, intermedio, avanzado)"
                    value={busqueda}
                    onChangeText={setBusqueda}
                    onSubmitEditing={handleBuscar}
                />
                <TouchableOpacity
                    style={[
                        globalStyles.button,
                        globalStyles.buttonPrimary,
                        styles.botonBuscar,
                    ]}
                    onPress={handleBuscar}
                >
                    <Ionicons name="search" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* TÍTULO DE SECCIÓN */}
            <View style={styles.tituloSeccion}>
                <Text style={styles.textoTituloSeccion}>
                    {esEntrenador ? "Mis Rutinas" : "Rutinas Disponibles"}
                </Text>
                <Text style={styles.contadorRutinas}>
                    {rutinas.length} {rutinas.length === 1 ? "rutina" : "rutinas"}
                </Text>
            </View>

            {/* LISTA DE RUTINAS */}
            {cargando ? (
                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                    style={{ marginTop: spacing.lg }}
                />
            ) : (
                <FlatList
                    data={rutinas}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: spacing.md }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refrescando}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="barbell-outline" size={80} color={colors.textTertiary} />
                            <Text style={globalStyles.emptyState}>
                                {esEntrenador
                                    ? "No has creado rutinas aún"
                                    : "No hay rutinas disponibles"}
                            </Text>
                            {esEntrenador && (
                                <TouchableOpacity
                                    style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.md }]}
                                    onPress={() => router.push("/rutina/crear")}
                                >
                                    <Text style={globalStyles.buttonText}>Crear Primera Rutina</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={globalStyles.card}
                            onPress={() => router.push(`/rutina/detalle?id=${item.id}`)}
                            activeOpacity={0.7}
                        >
                            {/* IMAGEN */}
                            {item.imagen_url ? (
                                <Image
                                    source={{ uri: item.imagen_url }}
                                    style={globalStyles.cardImage}
                                />
                            ) : (
                                <View style={styles.imagenPlaceholder}>
                                    <Ionicons name="barbell-outline" size={60} color={colors.textTertiary} />
                                    <Text style={globalStyles.textTertiary}>Sin imagen</Text>
                                </View>
                            )}

                            {/* INFORMACIÓN */}
                            <View style={styles.infoRutina}>
                                <View style={styles.headerRutina}>
                                    <Text style={styles.tituloRutina} numberOfLines={2}>
                                        {item.titulo}
                                    </Text>
                                    {renderNivelBadge(item.nivel)}
                                </View>

                                <Text style={globalStyles.textSecondary} numberOfLines={2}>
                                    {item.descripcion}
                                </Text>

                                {/* DETALLES RÁPIDOS */}
                                <View style={styles.detallesRutina}>
                                    <View style={styles.detalleItem}>
                                        <Ionicons name="barbell-outline" size={14} color={colors.primary} />
                                        <Text style={styles.textoDetalle}>
                                            {item.ejercicios.length} ejercicios
                                        </Text>
                                    </View>
                                    {item.duracion_minutos && (
                                        <View style={styles.detalleItem}>
                                            <Ionicons name="time-outline" size={14} color={colors.primary} />
                                            <Text style={styles.textoDetalle}>
                                                {item.duracion_minutos} min
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* BOTONES DE ACCIÓN (Solo para entrenadores y si es su rutina) */}
                            {esEntrenador && usuario?.id === item.entrenador_id && (
                                <View style={styles.botonesAccion}>
                                    <TouchableOpacity
                                        style={[
                                            globalStyles.button,
                                            globalStyles.buttonSecondary,
                                            styles.botonAccion,
                                        ]}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            router.push(`/rutina/editar?id=${item.id}`);
                                        }}
                                    >
                                        <MaterialIcons name="edit" size={16} color="white" />
                                        <Text style={globalStyles.buttonText}> Editar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            globalStyles.button,
                                            globalStyles.buttonDanger,
                                            styles.botonAccion,
                                        ]}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            handleEliminar(item.id);
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="white" />
                                        <Text style={globalStyles.buttonText}> Eliminar</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    saludo: {
        fontSize: fontSize.xl,
        fontWeight: "bold",
        color: colors.textPrimary,
    },
    rol: {
        fontSize: fontSize.xs,
        color: colors.primary,
        fontWeight: "500",
    },
    rolContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: spacing.xs / 2,
    },
    botonCerrar: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    contenedorBusqueda: {
        flexDirection: "row",
        padding: spacing.md,
        gap: spacing.sm,
    },
    inputBusqueda: {
        flex: 1,
        marginBottom: 0,
    },
    botonBuscar: {
        width: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    tituloSeccion: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
    },
    textoTituloSeccion: {
        fontSize: fontSize.lg,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    contadorRutinas: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    imagenPlaceholder: {
        width: "100%",
        height: 200,
        backgroundColor: colors.borderLight,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: borderRadius.md,
    },
    infoRutina: {
        paddingTop: spacing.md,
    },
    headerRutina: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.xs,
    },
    tituloRutina: {
        flex: 1,
        fontSize: fontSize.lg,
        fontWeight: "bold",
        color: colors.textPrimary,
        marginRight: spacing.sm,
    },
    badgeNivel: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.xs,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    textoNivel: {
        fontSize: fontSize.xs,
        fontWeight: "600",
    },
    detallesRutina: {
        flexDirection: "row",
        gap: spacing.md,
        marginTop: spacing.sm,
    },
    detalleItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    textoDetalle: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
    },
    botonesAccion: {
        flexDirection: "row",
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    botonAccion: {
        flex: 1,
        paddingVertical: spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: spacing.xxl,
    },
});