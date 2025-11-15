import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { useProgreso } from "../../src/presentation/hooks/useProgreso";
import { globalStyles } from "../../src/styles/globalStyles";
import {
    borderRadius,
    colors,
    fontSize,
    spacing,
} from "../../src/styles/theme";

export default function ExploreScreen() {
    const { usuario, esEntrenador } = useAuth();
    const { progresos, cargando, cargarProgreso, seleccionarFotos } = useProgreso(usuario?.id);
    const [refrescando, setRefrescando] = useState(false);
    const router = useRouter();

    const handleRefresh = async () => {
        setRefrescando(true);
        await cargarProgreso();
        setRefrescando(false);
    };

    // Si es entrenador, redirigir a crear rutina
    if (esEntrenador) {
        return (
            <View style={globalStyles.containerCentered}>
                <Ionicons name="barbell" size={80} color={colors.primary} />
                <Text style={styles.titulo}>Panel de Entrenador</Text>
                <Text style={globalStyles.textSecondary}>
                    Desde aquí podrás crear nuevas rutinas
                </Text>
                <TouchableOpacity
                    style={[globalStyles.button, globalStyles.buttonPrimary, styles.botonCrear]}
                    onPress={() => router.push("/rutina/crear")}
                >
                    <Ionicons name="add-circle" size={20} color={colors.white} />
                    <Text style={globalStyles.buttonText}> Crear Nueva Rutina</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[globalStyles.button, globalStyles.buttonSecondary, styles.botonVer]}
                    onPress={() => router.push("/(tabs)")}
                >
                    <Text style={globalStyles.buttonText}>Ver Mis Rutinas</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Para usuarios: mostrar su progreso
    const formatearFecha = (fecha: string) => {
        const date = new Date(fecha);
        return date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getSensacionEmoji = (sensacion?: string) => {
        switch (sensacion) {
            case "muy_facil":
                return "😊";
            case "facil":
                return "🙂";
            case "moderado":
                return "😐";
            case "dificil":
                return "😓";
            case "muy_dificil":
                return "😰";
            default:
                return "💪";
        }
    };

    const getSensacionTexto = (sensacion?: string) => {
        switch (sensacion) {
            case "muy_facil":
                return "Muy Fácil";
            case "facil":
                return "Fácil";
            case "moderado":
                return "Moderado";
            case "dificil":
                return "Difícil";
            case "muy_dificil":
                return "Muy Difícil";
            default:
                return "Sin calificar";
        }
    };

    return (
        <View style={globalStyles.container}>
            {/* HEADER */}
            <View style={globalStyles.header}>
                <View>
                    <Text style={styles.titulo}>Mi Progreso</Text>
                    <Text style={globalStyles.textSecondary}>
                        Historial de entrenamientos
                    </Text>
                </View>
                <View style={styles.estadisticas}>
                    <Text style={styles.numeroEstadistica}>{progresos.length}</Text>
                    <Text style={styles.textoEstadistica}>Entrenamientos</Text>
                </View>
            </View>

            {cargando ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={progresos}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refrescando}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name="fitness-outline"
                                size={80}
                                color={colors.textTertiary}
                            />
                            <Text style={globalStyles.emptyState}>
                                Aún no has registrado ningún entrenamiento
                            </Text>
                            <Text style={[globalStyles.textSecondary, { textAlign: "center", marginTop: spacing.sm }]}>
                                Completa tu primera rutina y registra tu progreso
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.tarjetaProgreso}>
                            {/* HEADER DE LA TARJETA */}
                            <View style={styles.headerTarjeta}>
                                <View>
                                    <Text style={styles.fechaProgreso}>
                                        {formatearFecha(item.fecha)}
                                    </Text>
                                    {item.duracion_real_minutos && (
                                        <View style={styles.duracionContainer}>
                                            <Ionicons
                                                name="time-outline"
                                                size={14}
                                                color={colors.primary}
                                            />
                                            <Text style={styles.duracionTexto}>
                                                {item.duracion_real_minutos} min
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                {item.sensacion && (
                                    <View style={styles.sensacionBadge}>
                                        <Text style={styles.sensacionEmoji}>
                                            {getSensacionEmoji(item.sensacion)}
                                        </Text>
                                        <Text style={styles.sensacionTexto}>
                                            {getSensacionTexto(item.sensacion)}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* EJERCICIOS COMPLETADOS */}
                            <View style={styles.ejerciciosContainer}>
                                <Text style={styles.subtitulo}>
                                    Ejercicios completados: {item.ejercicios_completados.length}
                                </Text>
                                {item.ejercicios_completados.slice(0, 3).map((ej, index) => (
                                    <View key={index} style={styles.ejercicioItem}>
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={16}
                                            color={colors.success}
                                        />
                                        <Text style={styles.ejercicioNombre} numberOfLines={1}>
                                            {ej.nombre}
                                        </Text>
                                        <Text style={styles.ejercicioDetalle}>
                                            {ej.series_completadas}×{ej.repeticiones_reales}
                                        </Text>
                                    </View>
                                ))}
                                {item.ejercicios_completados.length > 3 && (
                                    <Text style={styles.masEjercicios}>
                                        +{item.ejercicios_completados.length - 3} más...
                                    </Text>
                                )}
                            </View>

                            {/* NOTAS */}
                            {item.notas && (
                                <View style={styles.notasContainer}>
                                    <Ionicons
                                        name="document-text-outline"
                                        size={14}
                                        color={colors.textSecondary}
                                    />
                                    <Text style={styles.notasTexto} numberOfLines={2}>
                                        {item.notas}
                                    </Text>
                                </View>
                            )}

                            {/* FOTOS DE PROGRESO */}
                            {item.fotos_progreso && item.fotos_progreso.length > 0 && (
                                <View style={styles.fotosContainer}>
                                    <Ionicons name="images-outline" size={14} color={colors.primary} />
                                    <Text style={styles.fotosTexto}>
                                        {item.fotos_progreso.length} foto(s) de progreso
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                />
            )}

            {/* BOTÓN FLOTANTE PARA REGISTRAR PROGRESO */}
            {!esEntrenador && (
                <TouchableOpacity
                    style={styles.botonFlotante}
                    onPress={() => {
                        Alert.alert(
                            "Registrar Progreso",
                            "Esta funcionalidad se implementará próximamente.\n\nPodrás registrar tus entrenamientos completados con fotos y notas."
                        );
                    }}
                >
                    <Ionicons name="add" size={32} color={colors.white} />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    titulo: {
        fontSize: fontSize.xl,
        fontWeight: "bold",
        color: colors.textPrimary,
    },
    botonCrear: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    botonVer: {
        marginTop: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
    },
    estadisticas: {
        alignItems: "center",
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    numeroEstadistica: {
        fontSize: fontSize.xxl,
        fontWeight: "bold",
        color: colors.primary,
    },
    textoEstadistica: {
        fontSize: fontSize.xs,
        color: colors.primary,
        fontWeight: "500",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContainer: {
        padding: spacing.md,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: spacing.xxl * 2,
        paddingHorizontal: spacing.xl,
    },
    tarjetaProgreso: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    headerTarjeta: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.md,
    },
    fechaProgreso: {
        fontSize: fontSize.lg,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    duracionContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: spacing.xs,
    },
    duracionTexto: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    sensacionBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
    },
    sensacionEmoji: {
        fontSize: fontSize.md,
    },
    sensacionTexto: {
        fontSize: fontSize.xs,
        color: colors.primary,
        fontWeight: "600",
    },
    ejerciciosContainer: {
        marginBottom: spacing.md,
    },
    subtitulo: {
        fontSize: fontSize.sm,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    ejercicioItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingVertical: spacing.xs,
    },
    ejercicioNombre: {
        flex: 1,
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    ejercicioDetalle: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
    },
    masEjercicios: {
        fontSize: fontSize.xs,
        color: colors.primary,
        fontStyle: "italic",
        marginTop: spacing.xs,
    },
    notasContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.xs,
        backgroundColor: colors.background,
        padding: spacing.sm,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.sm,
    },
    notasTexto: {
        flex: 1,
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        fontStyle: "italic",
    },
    fotosContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    fotosTexto: {
        fontSize: fontSize.xs,
        color: colors.primary,
        fontWeight: "500",
    },
    botonFlotante: {
        position: "absolute",
        bottom: spacing.xl,
        right: spacing.xl,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
        elevation: 8,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
});