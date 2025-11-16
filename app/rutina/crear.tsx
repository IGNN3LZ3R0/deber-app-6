import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { Ejercicio } from "../../src/domain/models/Rutina";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { useRutinas } from "../../src/presentation/hooks/useRutinas";
import { globalStyles } from "../../src/styles/globalStyles";
import {
    borderRadius,
    colors,
    fontSize,
    spacing,
} from "../../src/styles/theme";

export default function CrearRutinaScreen() {
    const { usuario, esEntrenador } = useAuth();
    const { crear, seleccionarImagen, tomarFoto, seleccionarVideo, grabarVideo, subirVideo } = useRutinas();
    const router = useRouter();

    // Estados principales
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [nivel, setNivel] = useState<"principiante" | "intermedio" | "avanzado">("principiante");
    const [duracionMinutos, setDuracionMinutos] = useState("");
    const [imagenUri, setImagenUri] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);

    // Estados para ejercicios
    const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
    const [mostrarFormEjercicio, setMostrarFormEjercicio] = useState(false);

    // Estados del formulario de ejercicio
    const [nombreEjercicio, setNombreEjercicio] = useState("");
    const [series, setSeries] = useState("");
    const [repeticiones, setRepeticiones] = useState("");
    const [descanso, setDescanso] = useState("");
    const [notasEjercicio, setNotasEjercicio] = useState("");
    const [videoEjercicioUri, setVideoEjercicioUri] = useState<string | null>(null);
    const [subiendoVideo, setSubiendoVideo] = useState(false);

    // Agregar ejercicio a la lista
    const agregarEjercicio = () => {
        if (!nombreEjercicio.trim() || !series || !repeticiones || !descanso) {
            Alert.alert("Error", "Completa todos los campos obligatorios del ejercicio");
            return;
        }

        const nuevoEjercicio: Ejercicio = {
            nombre: nombreEjercicio.trim(),
            series: parseInt(series),
            repeticiones: repeticiones.trim(),
            descanso: descanso.trim(),
            notas: notasEjercicio.trim() || undefined,
            video_url: videoEjercicioUri || undefined,
        };

        setEjercicios([...ejercicios, nuevoEjercicio]);

        // Limpiar formulario
        setNombreEjercicio("");
        setSeries("");
        setRepeticiones("");
        setDescanso("");
        setNotasEjercicio("");
        setVideoEjercicioUri(null);
        setMostrarFormEjercicio(false);
    };

    const quitarEjercicio = (index: number) => {
        setEjercicios(ejercicios.filter((_, i) => i !== index));
    };

    const handleSeleccionarImagen = async () => {
        Alert.alert(
            "Imagen de Portada",
            "¿Desde dónde quieres agregar la imagen?",
            [
                {
                    text: "Galería de Fotos",
                    onPress: async () => {
                        const uri = await seleccionarImagen();
                        if (uri) {
                            setImagenUri(uri);
                        }
                    },
                },
                {
                    text: "Tomar Foto",
                    onPress: async () => {
                        const uri = await tomarFoto(); // ✅ Ahora funciona
                        if (uri) {
                            setImagenUri(uri);
                        }
                    },
                },
                {
                    text: "Cancelar",
                    style: "cancel",
                },
            ]
        );
    };

    const handleSeleccionarVideo = async () => {
        Alert.alert(
            "Video Demostrativo",
            "¿Desde dónde quieres agregar el video?",
            [
                {
                    text: "Galería",
                    onPress: async () => {
                        setSubiendoVideo(true);
                        const uri = await seleccionarVideo();
                        if (uri) {
                            const videoUrl = await subirVideo(uri);
                            if (videoUrl) {
                                setVideoEjercicioUri(videoUrl);
                                Alert.alert("Éxito", "Video subido correctamente");
                            } else {
                                Alert.alert("Error", "No se pudo subir el video");
                            }
                        }
                        setSubiendoVideo(false);
                    },
                },
                {
                    text: "Grabar Video",
                    onPress: async () => {
                        setSubiendoVideo(true);
                        const uri = await grabarVideo(); // ✅ Ahora funciona
                        if (uri) {
                            const videoUrl = await subirVideo(uri);
                            if (videoUrl) {
                                setVideoEjercicioUri(videoUrl);
                                Alert.alert("Éxito", "Video subido correctamente");
                            } else {
                                Alert.alert("Error", "No se pudo subir el video");
                            }
                        }
                        setSubiendoVideo(false);
                    },
                },
                {
                    text: "Cancelar",
                    style: "cancel",
                },
            ]
        );
    };

    const handleCrear = async () => {
        // Validaciones
        if (!titulo.trim() || !descripcion.trim()) {
            Alert.alert("Error", "Completa el título y la descripción");
            return;
        }

        if (ejercicios.length === 0) {
            Alert.alert("Error", "Agrega al menos un ejercicio a la rutina");
            return;
        }

        setCargando(true);
        const resultado = await crear(
            titulo,
            descripcion,
            ejercicios,
            usuario!.id,
            nivel,
            duracionMinutos ? parseInt(duracionMinutos) : undefined,
            imagenUri || undefined
        );
        setCargando(false);

        if (resultado.success) {
            Alert.alert("Éxito", "Rutina creada correctamente", [
                {
                    text: "OK",
                    onPress: () => {
                        router.push("/(tabs)");
                    },
                },
            ]);
        } else {
            Alert.alert("Error", resultado.error || "No se pudo crear la rutina");
        }
    };

    if (!esEntrenador) {
        return (
            <View style={globalStyles.containerCentered}>
                <Ionicons name="barbell-outline" size={64} color={colors.textTertiary} />
                <Text style={styles.textoNoEntrenador}>
                    Esta sección es solo para entrenadores
                </Text>
                <Text style={globalStyles.textSecondary}>
                    Crea una cuenta de entrenador para poder crear rutinas
                </Text>
            </View>
        );
    }

    return (
        <ScrollView style={globalStyles.container}>
            <View style={globalStyles.contentPadding}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.push("/(tabs)")}
                        style={styles.botonVolverContainer}
                    >
                        <Ionicons
                            name="arrow-back-outline"
                            size={fontSize.md}
                            color={colors.primary}
                        />
                        <Text style={styles.botonVolver}>Volver</Text>
                    </TouchableOpacity>
                    <Text style={globalStyles.title}>Nueva Rutina</Text>
                </View>

                {/* INFORMACIÓN BÁSICA */}
                <Text style={globalStyles.subtitle}>Información Básica</Text>

                <TextInput
                    style={globalStyles.input}
                    placeholder="Título de la rutina"
                    value={titulo}
                    onChangeText={setTitulo}
                />

                <TextInput
                    style={[globalStyles.input, globalStyles.inputMultiline]}
                    placeholder="Descripción"
                    value={descripcion}
                    onChangeText={setDescripcion}
                    multiline
                    numberOfLines={4}
                />

                <TextInput
                    style={globalStyles.input}
                    placeholder="Duración estimada (minutos)"
                    value={duracionMinutos}
                    onChangeText={setDuracionMinutos}
                    keyboardType="numeric"
                />

                {/* SELECTOR DE NIVEL */}
                <Text style={styles.label}>Nivel de dificultad:</Text>
                <View style={styles.contenedorNiveles}>
                    {(["principiante", "intermedio", "avanzado"] as const).map((n) => (
                        <TouchableOpacity
                            key={n}
                            style={[
                                styles.botonNivel,
                                nivel === n && styles.botonNivelActivo,
                            ]}
                            onPress={() => setNivel(n)}
                        >
                            <Text
                                style={[
                                    styles.textoNivel,
                                    nivel === n && styles.textoNivelActivo,
                                ]}
                            >
                                {n.charAt(0).toUpperCase() + n.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* IMAGEN DE PORTADA */}
                <TouchableOpacity
                    style={[globalStyles.button, globalStyles.buttonSecondary, styles.botonIcono]}
                    onPress={handleSeleccionarImagen}
                >
                    <Ionicons name="image-outline" size={18} color={colors.white} />
                    <Text style={globalStyles.buttonText}>
                        {imagenUri ? "Cambiar Imagen de Portada" : "Agregar Imagen de Portada"}
                    </Text>
                </TouchableOpacity>

                {imagenUri && (
                    <Image source={{ uri: imagenUri }} style={styles.vistaPrevia} />
                )}

                {/* SECCIÓN DE EJERCICIOS */}
                <View style={styles.seccionEjercicios}>
                    <Text style={globalStyles.subtitle}>
                        Ejercicios ({ejercicios.length})
                    </Text>

                    {/* LISTA DE EJERCICIOS */}
                    {ejercicios.map((ej, index) => (
                        <View key={index} style={styles.tarjetaEjercicio}>
                            <View style={styles.ejercicioInfo}>
                                <Text style={styles.ejercicioNombre}>{ej.nombre}</Text>
                                <Text style={styles.ejercicioDetalle}>
                                    {ej.series} series × {ej.repeticiones} reps
                                </Text>
                                <Text style={styles.ejercicioDetalle}>
                                    Descanso: {ej.descanso}
                                </Text>
                                {ej.video_url && (
                                    <View style={styles.badgeVideo}>
                                        <Ionicons name="play-circle" size={12} color={colors.primary} />
                                        <Text style={styles.textoVideo}>Con video</Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => quitarEjercicio(index)}>
                                <Ionicons name="trash-outline" size={24} color={colors.danger} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* BOTÓN AGREGAR EJERCICIO */}
                    {!mostrarFormEjercicio && (
                        <TouchableOpacity
                            style={[globalStyles.button, globalStyles.buttonPrimary]}
                            onPress={() => setMostrarFormEjercicio(true)}
                        >
                            <Ionicons name="add-circle-outline" size={20} color={colors.white} />
                            <Text style={globalStyles.buttonText}> Agregar Ejercicio</Text>
                        </TouchableOpacity>
                    )}

                    {/* FORMULARIO DE EJERCICIO */}
                    {mostrarFormEjercicio && (
                        <View style={styles.formEjercicio}>
                            <Text style={styles.tituloForm}>Nuevo Ejercicio</Text>

                            <TextInput
                                style={globalStyles.input}
                                placeholder="Nombre del ejercicio *"
                                value={nombreEjercicio}
                                onChangeText={setNombreEjercicio}
                            />

                            <View style={styles.filaInputs}>
                                <TextInput
                                    style={[globalStyles.input, styles.inputPequeno]}
                                    placeholder="Series *"
                                    value={series}
                                    onChangeText={setSeries}
                                    keyboardType="numeric"
                                />
                                <TextInput
                                    style={[globalStyles.input, styles.inputPequeno]}
                                    placeholder="Reps *"
                                    value={repeticiones}
                                    onChangeText={setRepeticiones}
                                />
                                <TextInput
                                    style={[globalStyles.input, styles.inputPequeno]}
                                    placeholder="Descanso *"
                                    value={descanso}
                                    onChangeText={setDescanso}
                                />
                            </View>

                            <TextInput
                                style={[globalStyles.input, globalStyles.inputMultiline]}
                                placeholder="Notas o instrucciones (opcional)"
                                value={notasEjercicio}
                                onChangeText={setNotasEjercicio}
                                multiline
                                numberOfLines={3}
                            />

                            <TouchableOpacity
                                style={[globalStyles.button, globalStyles.buttonSecondary]}
                                onPress={handleSeleccionarVideo}
                                disabled={subiendoVideo}
                            >
                                {subiendoVideo ? (
                                    <ActivityIndicator color={colors.white} />
                                ) : (
                                    <>
                                        <Ionicons name="videocam-outline" size={18} color={colors.white} />
                                        <Text style={globalStyles.buttonText}>
                                            {videoEjercicioUri ? " Video Agregado" : " Agregar Video Demo"}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <View style={styles.botonesForm}>
                                <TouchableOpacity
                                    style={[globalStyles.button, styles.botonCancelar]}
                                    onPress={() => {
                                        setMostrarFormEjercicio(false);
                                        setNombreEjercicio("");
                                        setSeries("");
                                        setRepeticiones("");
                                        setDescanso("");
                                        setNotasEjercicio("");
                                        setVideoEjercicioUri(null);
                                    }}
                                >
                                    <Text style={styles.textoCancelar}>Cancelar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[globalStyles.button, globalStyles.buttonPrimary, { flex: 1 }]}
                                    onPress={agregarEjercicio}
                                >
                                    <Text style={globalStyles.buttonText}>Agregar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* BOTÓN CREAR RUTINA */}
                <TouchableOpacity
                    style={[
                        globalStyles.button,
                        globalStyles.buttonPrimary,
                        styles.botonCrear,
                    ]}
                    onPress={handleCrear}
                    disabled={cargando}
                >
                    {cargando ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={globalStyles.buttonText}>Publicar Rutina</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    header: {
        marginBottom: spacing.lg,
    },
    botonVolverContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: spacing.sm,
    },
    botonVolver: {
        fontSize: fontSize.md,
        color: colors.primary,
    },
    textoNoEntrenador: {
        fontSize: fontSize.xl,
        fontWeight: "bold",
        textAlign: "center",
        color: colors.textPrimary,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    label: {
        fontSize: fontSize.md,
        marginBottom: spacing.sm,
        color: colors.textPrimary,
        fontWeight: "500",
    },
    contenedorNiveles: {
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    botonNivel: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: "center",
        backgroundColor: colors.white,
    },
    botonNivelActivo: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    textoNivel: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    textoNivelActivo: {
        color: colors.primary,
        fontWeight: "bold",
    },
    botonIcono: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    vistaPrevia: {
        width: "100%",
        height: 200,
        borderRadius: borderRadius.md,
        marginVertical: spacing.md,
    },
    seccionEjercicios: {
        marginTop: spacing.lg,
    },
    tarjetaEjercicio: {
        flexDirection: "row",
        backgroundColor: colors.white,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    ejercicioInfo: {
        flex: 1,
    },
    ejercicioNombre: {
        fontSize: fontSize.md,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    ejercicioDetalle: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    badgeVideo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: spacing.xs,
    },
    textoVideo: {
        fontSize: fontSize.xs,
        color: colors.primary,
        fontWeight: "500",
    },
    formEjercicio: {
        backgroundColor: colors.primaryLight,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginTop: spacing.sm,
    },
    tituloForm: {
        fontSize: fontSize.lg,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    filaInputs: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    inputPequeno: {
        flex: 1,
    },
    botonesForm: {
        flexDirection: "row",
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    botonCancelar: {
        flex: 1,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
    },
    textoCancelar: {
        color: colors.textPrimary,
        fontSize: fontSize.md,
        fontWeight: "600",
    },
    botonCrear: {
        marginTop: spacing.xl,
        padding: spacing.lg,
        marginBottom: spacing.xxl,
    },
});