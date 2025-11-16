import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { useRutinas } from "../../src/presentation/hooks/useRutinas";
import { globalStyles } from "../../src/styles/globalStyles";
import {
    borderRadius,
    colors,
    fontSize,
    spacing,
} from "../../src/styles/theme";

export default function DetalleRutinaScreen() {
    const { id } = useLocalSearchParams();
    const { usuario, esEntrenador } = useAuth();
    const { rutinas } = useRutinas();
    const router = useRouter();

    const [videoModalVisible, setVideoModalVisible] = useState(false);
    const [videoUrlActual, setVideoUrlActual] = useState<string | null>(null);

    const rutina = rutinas.find((r) => r.id === id);

    if (!rutina) {
        return (
            <View style={globalStyles.containerCentered}>
                <Ionicons name="alert-circle-outline" size={80} color={colors.textTertiary} />
                <Text style={globalStyles.emptyState}>Rutina no encontrada</Text>
                <TouchableOpacity
                    style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.md }]}
                    onPress={() => router.back()}
                >
                    <Text style={globalStyles.buttonText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

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
                <Ionicons name={iconoNivel as any} size={16} color={colorNivel} />
                <Text style={[styles.textoNivel, { color: colorNivel }]}>
                    {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
                </Text>
            </View>
        );
    };

    const abrirVideo = (url: string) => {
        setVideoUrlActual(url);
        setVideoModalVisible(true);
    };

    const cerrarVideo = () => {
        setVideoModalVisible(false);
        setVideoUrlActual(null);
    };

    const puedeEditar = esEntrenador && usuario?.id === rutina.entrenador_id;

    return (
        <ScrollView style={globalStyles.container}>
            <View style={globalStyles.contentPadding}>
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.botonVolverContainer}
                    >
                        <Ionicons
                            name="arrow-back-outline"
                            size={24}
                            color={colors.primary}
                        />
                        <Text style={styles.botonVolver}>Volver</Text>
                    </TouchableOpacity>

                    {puedeEditar && (
                        <TouchableOpacity
                            style={[globalStyles.button, globalStyles.buttonSecondary, styles.botonEditar]}
                            onPress={() => router.push(`/rutina/editar?id=${rutina.id}`)}
                        >
                            <Ionicons name="pencil-outline" size={16} color={colors.white} />
                            <Text style={globalStyles.buttonText}> Editar</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* IMAGEN DE PORTADA */}
                {rutina.imagen_url ? (
                    <Image source={{ uri: rutina.imagen_url }} style={styles.imagenPortada} />
                ) : (
                    <View style={styles.imagenPlaceholder}>
                        <Ionicons name="barbell-outline" size={80} color={colors.textTertiary} />
                        <Text style={globalStyles.textTertiary}>Sin imagen</Text>
                    </View>
                )}

                {/* TÍTULO Y NIVEL */}
                <View style={styles.headerInfo}>
                    <Text style={styles.titulo}>{rutina.titulo}</Text>
                    {renderNivelBadge(rutina.nivel)}
                </View>

                {/* DESCRIPCIÓN */}
                <Text style={styles.descripcion}>{rutina.descripcion}</Text>

                {/* INFORMACIÓN RÁPIDA */}
                <View style={styles.infoRapida}>
                    <View style={styles.infoItem}>
                        <Ionicons name="barbell-outline" size={20} color={colors.primary} />
                        <Text style={styles.infoTexto}>
                            {rutina.ejercicios.length} ejercicios
                        </Text>
                    </View>
                    {rutina.duracion_minutos && (
                        <View style={styles.infoItem}>
                            <Ionicons name="time-outline" size={20} color={colors.primary} />
                            <Text style={styles.infoTexto}>
                                {rutina.duracion_minutos} min
                            </Text>
                        </View>
                    )}
                </View>

                {/* LISTA DE EJERCICIOS */}
                <View style={styles.seccionEjercicios}>
                    <Text style={globalStyles.subtitle}>Ejercicios</Text>

                    {rutina.ejercicios.map((ejercicio, index) => (
                        <View key={index} style={styles.tarjetaEjercicio}>
                            <View style={styles.numeroEjercicio}>
                                <Text style={styles.numeroTexto}>{index + 1}</Text>
                            </View>

                            <View style={styles.ejercicioInfo}>
                                <Text style={styles.ejercicioNombre}>{ejercicio.nombre}</Text>

                                <View style={styles.ejercicioDetalles}>
                                    <View style={styles.detalleTag}>
                                        <Ionicons name="repeat-outline" size={14} color={colors.primary} />
                                        <Text style={styles.detalleTexto}>
                                            {ejercicio.series} series
                                        </Text>
                                    </View>

                                    <View style={styles.detalleTag}>
                                        <Ionicons name="fitness-outline" size={14} color={colors.primary} />
                                        <Text style={styles.detalleTexto}>
                                            {ejercicio.repeticiones} reps
                                        </Text>
                                    </View>

                                    <View style={styles.detalleTag}>
                                        <Ionicons name="time-outline" size={14} color={colors.primary} />
                                        <Text style={styles.detalleTexto}>
                                            {ejercicio.descanso}
                                        </Text>
                                    </View>
                                </View>

                                {ejercicio.notas && (
                                    <View style={styles.notasContainer}>
                                        <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
                                        <Text style={styles.notasTexto}>{ejercicio.notas}</Text>
                                    </View>
                                )}

                                {ejercicio.video_url && (
                                    <TouchableOpacity
                                        style={styles.botonVideo}
                                        onPress={() => abrirVideo(ejercicio.video_url!)}
                                    >
                                        <Ionicons name="play-circle" size={18} color={colors.white} />
                                        <Text style={styles.textoBotonVideo}>Ver demostración</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                {/* BOTÓN DE ACCIÓN PARA USUARIOS */}
                {!esEntrenador && (
                    <TouchableOpacity
                        style={[globalStyles.button, globalStyles.buttonPrimary, styles.botonComenzar]}
                        onPress={() => {
                            Alert.alert(
                                "Comenzar Rutina",
                                "Esta funcionalidad estará disponible próximamente.\n\nPodrás registrar tu progreso mientras realizas los ejercicios."
                            );
                        }}
                    >
                        <Ionicons name="play" size={20} color={colors.white} />
                        <Text style={globalStyles.buttonText}> Comenzar Entrenamiento</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* MODAL DE VIDEO */}
            <Modal
                visible={videoModalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={cerrarVideo}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitulo}>Video Demostrativo</Text>
                        <TouchableOpacity onPress={cerrarVideo}>
                            <Ionicons name="close-circle" size={32} color={colors.danger} />
                        </TouchableOpacity>
                    </View>

                    {videoUrlActual && (
                        <Video
                            source={{ uri: videoUrlActual }}
                            style={styles.video}
                            useNativeControls
                            resizeMode={ResizeMode.CONTAIN}
                            shouldPlay
                        />
                    )}
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    botonVolverContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    botonVolver: {
        fontSize: fontSize.md,
        color: colors.primary,
        fontWeight: "500",
    },
    botonEditar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    imagenPortada: {
        width: "100%",
        height: 250,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        backgroundColor: colors.borderLight,
    },
    imagenPlaceholder: {
        width: "100%",
        height: 250,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        backgroundColor: colors.borderLight,
        justifyContent: "center",
        alignItems: "center",
    },
    headerInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.sm,
    },
    titulo: {
        flex: 1,
        fontSize: fontSize.xxl,
        fontWeight: "bold",
        color: colors.textPrimary,
        marginRight: spacing.sm,
    },
    badgeNivel: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
    },
    textoNivel: {
        fontSize: fontSize.sm,
        fontWeight: "600",
    },
    descripcion: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        lineHeight: 22,
        marginBottom: spacing.lg,
    },
    infoRapida: {
        flexDirection: "row",
        gap: spacing.lg,
        marginBottom: spacing.xl,
        padding: spacing.md,
        backgroundColor: colors.primaryLight,
        borderRadius: borderRadius.md,
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    infoTexto: {
        fontSize: fontSize.md,
        color: colors.textPrimary,
        fontWeight: "500",
    },
    seccionEjercicios: {
        marginBottom: spacing.xl,
    },
    tarjetaEjercicio: {
        flexDirection: "row",
        backgroundColor: colors.white,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    numeroEjercicio: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: spacing.md,
    },
    numeroTexto: {
        fontSize: fontSize.md,
        fontWeight: "bold",
        color: colors.white,
    },
    ejercicioInfo: {
        flex: 1,
    },
    ejercicioNombre: {
        fontSize: fontSize.lg,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    ejercicioDetalles: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    detalleTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    detalleTexto: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    notasContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.xs,
        backgroundColor: colors.primaryLight,
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
    botonVideo: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        alignSelf: "flex-start",
    },
    textoBotonVideo: {
        fontSize: fontSize.sm,
        color: colors.white,
        fontWeight: "600",
    },
    botonComenzar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        padding: spacing.lg,
        marginBottom: spacing.xxl,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: colors.black,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: spacing.md,
        backgroundColor: colors.white,
    },
    modalTitulo: {
        fontSize: fontSize.lg,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    video: {
        flex: 1,
        width: "100%",
    },
});