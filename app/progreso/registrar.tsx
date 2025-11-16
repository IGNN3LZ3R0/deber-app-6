import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { useRutinas } from "../../src/presentation/hooks/useRutinas";
import { useProgreso } from "../../src/presentation/hooks/useProgreso";
import { globalStyles } from "../../src/styles/globalStyles";
import {
    borderRadius,
    colors,
    fontSize,
    spacing,
} from "../../src/styles/theme";

type EjercicioCompletado = {
    nombre: string;
    series: number;
    repeticiones: string;
    descanso: string;
    series_completadas: number;
    repeticiones_reales: string;
    peso_usado?: string;
};

export default function RegistrarProgresoScreen() {
    const { rutinaId } = useLocalSearchParams();
    const { usuario } = useAuth();
    const { rutinas } = useRutinas();
    const { registrar, seleccionarFotos, tomarFoto } = useProgreso(usuario?.id);
    const router = useRouter();

    const rutina = rutinas.find((r) => r.id === rutinaId);

    const [ejerciciosCompletados, setEjerciciosCompletados] = useState<EjercicioCompletado[]>(
        rutina?.ejercicios.map((ej) => ({
            ...ej,
            series_completadas: ej.series,
            repeticiones_reales: ej.repeticiones,
            peso_usado: "",
        })) || []
    );

    const [duracionMinutos, setDuracionMinutos] = useState("");
    const [sensacion, setSensacion] = useState<string | undefined>();
    const [notas, setNotas] = useState("");
    const [fotosUris, setFotosUris] = useState<string[]>([]);
    const [guardando, setGuardando] = useState(false);

    if (!rutina) {
        return (
            <View style={globalStyles.containerCentered}>
                <Text style={globalStyles.emptyState}>Rutina no encontrada</Text>
            </View>
        );
    }

    const actualizarEjercicio = (
        index: number,
        campo: keyof EjercicioCompletado,
        valor: any
    ) => {
        const nuevosEjercicios = [...ejerciciosCompletados];
        (nuevosEjercicios[index] as any)[campo] = valor;
        setEjerciciosCompletados(nuevosEjercicios);
    };

    const handleSeleccionarFotos = async () => {
        Alert.alert(
            "Agregar Foto de Progreso",
            "¿Desde dónde quieres agregar la foto?",
            [
                {
                    text: "Tomar Foto",
                    onPress: async () => {
                        const uri = await tomarFoto();
                        if (uri) {
                            setFotosUris([...fotosUris, uri]);
                        }
                    },
                },
                {
                    text: "Galería",
                    onPress: async () => {
                        const uris = await seleccionarFotos();
                        setFotosUris([...fotosUris, ...uris]);
                    },
                },
                {
                    text: "Cancelar",
                    style: "cancel",
                },
            ]
        );
    };

    const eliminarFoto = (index: number) => {
        setFotosUris(fotosUris.filter((_, i) => i !== index));
    };

    const handleGuardar = async () => {
        if (!usuario?.id) {
            Alert.alert("Error", "No hay usuario autenticado");
            return;
        }

        setGuardando(true);

        const resultado = await registrar(
            rutinaId as string, // plan_id = rutina_id por ahora
            new Date().toISOString().split("T")[0],
            ejerciciosCompletados,
            duracionMinutos ? parseInt(duracionMinutos) : undefined,
            sensacion,
            notas || undefined,
            fotosUris.length > 0 ? fotosUris : undefined
        );

        setGuardando(false);

        if (resultado.success) {
            Alert.alert("¡Éxito!", "Progreso registrado correctamente", [
                {
                    text: "OK",
                    onPress: () => router.push("/(tabs)/explore"),
                },
            ]);
        } else {
            Alert.alert("Error", resultado.error || "No se pudo guardar el progreso");
        }
    };

    const sensaciones = [
        { valor: "muy_facil", emoji: "😊", texto: "Muy Fácil" },
        { valor: "facil", emoji: "🙂", texto: "Fácil" },
        { valor: "moderado", emoji: "😐", texto: "Moderado" },
        { valor: "dificil", emoji: "😓", texto: "Difícil" },
        { valor: "muy_dificil", emoji: "😰", texto: "Muy Difícil" },
    ];

    return (
        <ScrollView style={globalStyles.container}>
            <View style={globalStyles.contentPadding}>
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.botonVolverContainer}
                    >
                        <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
                        <Text style={styles.botonVolver}>Cancelar</Text>
                    </TouchableOpacity>
                </View>

                <Text style={globalStyles.title}>Registrar Progreso</Text>
                <Text style={globalStyles.textSecondary}>Rutina: {rutina.titulo}</Text>

                {/* DURACIÓN */}
                <View style={styles.seccion}>
                    <Text style={styles.labelSeccion}>Duración del entrenamiento</Text>
                    <TextInput
                        style={globalStyles.input}
                        placeholder="Minutos"
                        keyboardType="numeric"
                        value={duracionMinutos}
                        onChangeText={setDuracionMinutos}
                    />
                </View>

                {/* SENSACIÓN */}
                <View style={styles.seccion}>
                    <Text style={styles.labelSeccion}>¿Cómo te sentiste?</Text>
                    <View style={styles.sensacionContainer}>
                        {sensaciones.map((s) => (
                            <TouchableOpacity
                                key={s.valor}
                                style={[
                                    styles.sensacionBoton,
                                    sensacion === s.valor && styles.sensacionActiva,
                                ]}
                                onPress={() => setSensacion(s.valor)}
                            >
                                <Text style={styles.sensacionEmoji}>{s.emoji}</Text>
                                <Text
                                    style={[
                                        styles.sensacionTexto,
                                        sensacion === s.valor && styles.sensacionTextoActivo,
                                    ]}
                                >
                                    {s.texto}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* EJERCICIOS */}
                <View style={styles.seccion}>
                    <Text style={styles.labelSeccion}>Ejercicios realizados</Text>

                    {ejerciciosCompletados.map((ej, index) => (
                        <View key={index} style={styles.tarjetaEjercicio}>
                            <Text style={styles.ejercicioNombre}>{ej.nombre}</Text>

                            <View style={styles.ejercicioInputs}>
                                <View style={styles.inputGrupo}>
                                    <Text style={styles.labelInput}>Series</Text>
                                    <TextInput
                                        style={[globalStyles.input, styles.inputPequeno]}
                                        keyboardType="numeric"
                                        value={ej.series_completadas.toString()}
                                        onChangeText={(valor) =>
                                            actualizarEjercicio(
                                                index,
                                                "series_completadas",
                                                parseInt(valor) || 0
                                            )
                                        }
                                    />
                                </View>

                                <View style={styles.inputGrupo}>
                                    <Text style={styles.labelInput}>Reps</Text>
                                    <TextInput
                                        style={[globalStyles.input, styles.inputPequeno]}
                                        value={ej.repeticiones_reales}
                                        onChangeText={(valor) =>
                                            actualizarEjercicio(index, "repeticiones_reales", valor)
                                        }
                                    />
                                </View>

                                <View style={styles.inputGrupo}>
                                    <Text style={styles.labelInput}>Peso (kg)</Text>
                                    <TextInput
                                        style={[globalStyles.input, styles.inputPequeno]}
                                        placeholder="Opcional"
                                        keyboardType="numeric"
                                        value={ej.peso_usado}
                                        onChangeText={(valor) =>
                                            actualizarEjercicio(index, "peso_usado", valor)
                                        }
                                    />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* NOTAS */}
                <View style={styles.seccion}>
                    <Text style={styles.labelSeccion}>Notas adicionales</Text>
                    <TextInput
                        style={[globalStyles.input, globalStyles.inputMultiline]}
                        placeholder="¿Cómo te fue? ¿Algún comentario?"
                        multiline
                        numberOfLines={4}
                        value={notas}
                        onChangeText={setNotas}
                    />
                </View>

                {/* FOTOS */}
                <View style={styles.seccion}>
                    <Text style={styles.labelSeccion}>Fotos de progreso</Text>

                    <View style={styles.fotosContainer}>
                        {fotosUris.map((uri, index) => (
                            <View key={index} style={styles.fotoItem}>
                                <Image source={{ uri }} style={styles.fotoPreview} />
                                <TouchableOpacity
                                    style={styles.botonEliminarFoto}
                                    onPress={() => eliminarFoto(index)}
                                >
                                    <Ionicons name="close-circle" size={24} color={colors.danger} />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity
                            style={styles.botonAgregarFoto}
                            onPress={handleSeleccionarFotos}
                        >
                            <Ionicons name="camera-outline" size={32} color={colors.primary} />
                            <Text style={styles.textoAgregarFoto}>Agregar foto</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* BOTÓN GUARDAR */}
                <TouchableOpacity
                    style={[
                        globalStyles.button,
                        globalStyles.buttonPrimary,
                        styles.botonGuardar,
                    ]}
                    onPress={handleGuardar}
                    disabled={guardando}
                >
                    {guardando ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                            <Text style={globalStyles.buttonText}> Guardar Progreso</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    header: {
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
    seccion: {
        marginTop: spacing.lg,
    },
    labelSeccion: {
        fontSize: fontSize.lg,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    sensacionContainer: {
        flexDirection: "row",
        gap: spacing.xs,
        flexWrap: "wrap",
    },
    sensacionBoton: {
        alignItems: "center",
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        borderColor: colors.border,
        backgroundColor: colors.white,
        minWidth: 70,
    },
    sensacionActiva: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    sensacionEmoji: {
        fontSize: fontSize.xl,
        marginBottom: spacing.xs,
    },
    sensacionTexto: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
    },
    sensacionTextoActivo: {
        color: colors.primary,
        fontWeight: "600",
    },
    tarjetaEjercicio: {
        backgroundColor: colors.white,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    ejercicioNombre: {
        fontSize: fontSize.md,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    ejercicioInputs: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    inputGrupo: {
        flex: 1,
    },
    labelInput: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        marginBottom: spacing.xs / 2,
    },
    inputPequeno: {
        marginBottom: 0,
        textAlign: "center",
    },
    fotosContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    fotoItem: {
        position: "relative",
    },
    fotoPreview: {
        width: 100,
        height: 100,
        borderRadius: borderRadius.md,
    },
    botonEliminarFoto: {
        position: "absolute",
        top: -8,
        right: -8,
        backgroundColor: colors.white,
        borderRadius: 12,
    },
    botonAgregarFoto: {
        width: 100,
        height: 100,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: colors.border,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
    },
    textoAgregarFoto: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    botonGuardar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        padding: spacing.lg,
        marginTop: spacing.xl,
        marginBottom: spacing.xxl,
    },
});