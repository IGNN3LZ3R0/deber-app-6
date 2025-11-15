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
// 1. IMPORTAR LOS ICONOS
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/presentation/hooks/useAuth";
import { useRecipes } from "../../src/presentation/hooks/useRecipes";
import { globalStyles } from "../../src/styles/globalStyles";
import {
    borderRadius,
    colors,
    fontSize,
    spacing,
} from "../../src/styles/theme";

export default function CrearRecetaScreen() {
    const { usuario, esChef } = useAuth();
    const { crear, seleccionarImagen, tomarFoto } = useRecipes();
    const router = useRouter();

    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [ingrediente, setIngrediente] = useState("");
    const [ingredientes, setIngredientes] = useState<string[]>([]);
    const [imagenUri, setImagenUri] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);

    const agregarIngrediente = () => {
        if (ingrediente.trim()) {
            setIngredientes([...ingredientes, ingrediente.trim()]);
            setIngrediente("");
        }
    };

    const quitarIngrediente = (index: number) => {
        setIngredientes(ingredientes.filter((_, i) => i !== index));
    };

    const handleSeleccionarImagen = async () => {
        Alert.alert(
            "Agregar Imagen",
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
                    text: "Tomar Foto (Cámara)",
                    onPress: async () => {
                        const uri = await tomarFoto();
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

    const handleCrear = async () => {
        if (!titulo || !descripcion || ingredientes.length === 0) {
            Alert.alert(
                "Error",
                "Completa todos los campos y agrega al menos un ingrediente"
            );
            return;
        }

        setCargando(true);
        const resultado = await crear(
            titulo,
            descripcion,
            ingredientes,
            usuario!.id,
            imagenUri || undefined
        );
        setCargando(false);

        if (resultado.success) {
            Alert.alert("Éxito", "Receta creada correctamente", [
                {
                    text: "OK",
                    onPress: () => {
                        setTitulo("");
                        setDescripcion("");
                        setIngredientes([]);
                        setImagenUri(null);
                        router.push("/(tabs)");
                    },
                },
            ]);
        } else {
            Alert.alert("Error", resultado.error || "No se pudo crear la receta");
        }
    };

    if (!esChef) {
        return (
            <View style={globalStyles.containerCentered}>
                {/* --- 2. ICONO DE CHEF --- */}
                <Text style={styles.textoNoChef}>
                    Esta sección es solo para chefs{" "}
                    <Ionicons name="restaurant-outline" size={fontSize.xl} color={colors.textPrimary} />
                </Text>
                <Text style={globalStyles.textSecondary}>
                    Crea una cuenta de chef para poder publicar recetas
                </Text>
            </View>
        );
    }

    return (
        <ScrollView style={globalStyles.container}>
            <View style={globalStyles.contentPadding}>
                <View style={styles.header}>
                    {/* --- 3. ICONO DE VOLVER --- */}
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
                    <Text style={globalStyles.title}>Nueva Receta</Text>
                </View>

                <TextInput
                    style={globalStyles.input}
                    placeholder="Título de la receta"
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

                <Text style={globalStyles.subtitle}>Ingredientes:</Text>
                <View style={styles.contenedorIngrediente}>
                    <TextInput
                        style={[globalStyles.input, styles.inputIngrediente]}
                        placeholder="Ej: Tomate"
                        value={ingrediente}
                        onChangeText={setIngrediente}
                        onSubmitEditing={agregarIngrediente}
                    />
                    <TouchableOpacity
                        style={[
                            globalStyles.button,
                            globalStyles.buttonPrimary,
                            styles.botonAgregar,
                        ]}
                        onPress={agregarIngrediente}
                    >
                        {/* --- 4. ICONO DE AGREGAR --- */}
                        <Ionicons name="add" size={fontSize.xl} color={colors.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.listaIngredientes}>
                    {ingredientes.map((ing, index) => (
                        <View key={index} style={globalStyles.chip}>
                            <Text style={globalStyles.chipText}>{ing}</Text>
                            <TouchableOpacity onPress={() => quitarIngrediente(index)}>
                                {/* --- 5. ICONO DE QUITAR (X) --- */}
                                <Ionicons
                                    name="close"
                                    size={fontSize.lg}
                                    color={colors.primary}
                                    style={{ marginLeft: 4 }} // Ajuste de espacio
                                />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* --- 6. ICONO DE AGREGAR FOTO --- */}
                <TouchableOpacity
                    style={[
                        globalStyles.button,
                        globalStyles.buttonSecondary,
                        styles.botonIcono, // Usar estilo para alinear
                    ]}
                    onPress={handleSeleccionarImagen}
                >
                    <Ionicons
                        name="camera-outline"
                        size={18}
                        color={colors.white}
                    />
                    <Text style={globalStyles.buttonText}>
                        {imagenUri ? " Cambiar Foto" : " Agregar Foto"}
                    </Text>
                </TouchableOpacity>

                {imagenUri && (
                    <Image source={{ uri: imagenUri }} style={styles.vistaPrevia} />
                )}

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
                        <Text style={globalStyles.buttonText}>Publicar Receta</Text>
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
    // ESTILO PARA EL BOTÓN VOLVER (CONTENEDOR)
    botonVolverContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: spacing.sm,
    },
    botonVolver: {
        fontSize: fontSize.md,
        color: colors.primary,
        // marginBottom quitado, ahora está en el container
    },
    textoNoChef: {
        fontSize: fontSize.xl,
        fontWeight: "bold",
        textAlign: "center",
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    contenedorIngrediente: {
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    inputIngrediente: {
        flex: 1,
        marginBottom: 0,
    },
    botonAgregar: {
        width: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    // 'textoAgregar' ya no es necesario, el icono lo reemplaza

    listaIngredientes: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    // 'textoEliminar' ya no es necesario, el icono lo reemplaza

    // ESTILO GENÉRICO PARA BOTONES CON ICONOS
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
    botonCrear: {
        marginTop: spacing.sm,
        padding: spacing.lg,
    },
});