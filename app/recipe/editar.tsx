import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
// 1. IMPORTAR ICONOS
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

export default function EditarRecetaScreen() {
    const { id } = useLocalSearchParams();
    const { usuario } = useAuth();
    // 2. OBTENER 'tomarFoto' DEL HOOK (para Reto 3)
    const { recetas, actualizar, seleccionarImagen, tomarFoto } = useRecipes();
    const router = useRouter();

    const receta = recetas.find((r) => r.id === id);

    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [ingrediente, setIngrediente] = useState("");
    const [ingredientes, setIngredientes] = useState<string[]>([]);
    const [cargando, setCargando] = useState(false);
    const [imagenUri, setImagenUri] = useState<string | null>(null);

    // Cargar datos de la receta al iniciar
    useEffect(() => {
        if (receta) {
            setTitulo(receta.titulo);
            setDescripcion(receta.descripcion);
            setIngredientes(receta.ingredientes);
        }
    }, [receta]);

    // Validar que el usuario es el dueño
    if (!receta) {
        return (
            <View style={globalStyles.containerCentered}>
                <Text style={globalStyles.textSecondary}>Receta no encontrada</Text>
            </View>
        );
    }

    if (receta.chef_id !== usuario?.id) {
        return (
            <View style={globalStyles.containerCentered}>
                <Text style={styles.textoError}>
                    No tienes permiso para editar esta receta
                </Text>
                <TouchableOpacity
                    style={[globalStyles.button, globalStyles.buttonPrimary]}
                    onPress={() => router.back()}
                >
                    <Text style={globalStyles.buttonText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const agregarIngrediente = () => {
        if (ingrediente.trim()) {
            setIngredientes([...ingredientes, ingrediente.trim()]);
            setIngrediente("");
        }
    };

    const quitarIngrediente = (index: number) => {
        setIngredientes(ingredientes.filter((_, i) => i !== index));
    };

    // 3. IMPLEMENTAR RETO 3 (Cámara/Galería)
    const handleSeleccionarImagen = async () => {
        Alert.alert(
            "Actualizar Imagen",
            "¿Desde dónde quieres agregar la nueva imagen?",
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

    const handleGuardar = async () => {
        if (!titulo || !descripcion || ingredientes.length === 0) {
            Alert.alert("Error", "Completa todos los campos");
            return;
        }

        setCargando(true);
        const resultado = await actualizar(
            receta.id,
            titulo,
            descripcion,
            ingredientes,
            // 4. PASAR LA NUEVA IMAGEN (SI EXISTE)
            imagenUri || undefined
        );
        setCargando(false);

        if (resultado.success) {
            Alert.alert("Éxito", "Receta actualizada correctamente", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } else {
            Alert.alert("Error", resultado.error || "No se pudo actualizar");
        }
    };

    return (
        <ScrollView style={globalStyles.container}>
            <View style={globalStyles.contentPadding}>
                <View style={styles.header}>
                    {/* --- 5. ICONO DE VOLVER --- */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.botonVolverContainer}
                    >
                        <Ionicons
                            name="arrow-back-outline"
                            size={fontSize.md}
                            color={colors.primary}
                        />
                        <Text style={styles.botonVolver}>Cancelar</Text>
                    </TouchableOpacity>
                    <Text style={globalStyles.title}>Editar Receta</Text>
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
                        {/* --- 6. ICONO DE AGREGAR --- */}
                        <Ionicons name="add" size={fontSize.xl} color={colors.white} />
                    </TouchableOpacity>
                </View>

                {/* --- 7. UI FIX: Mover lista de ingredientes aquí --- */}
                <View style={styles.listaIngredientes}>
                    {ingredientes.map((ing, index) => (
                        <View key={index} style={globalStyles.chip}>
                            <Text style={globalStyles.chipText}>{ing}</Text>
                            <TouchableOpacity onPress={() => quitarIngrediente(index)}>
                                {/* --- 8. ICONO DE QUITAR (X) --- */}
                                <Ionicons
                                    name="close"
                                    size={fontSize.lg}
                                    color={colors.primary}
                                    style={{ marginLeft: 4 }}
                                />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* --- 9. IMPLEMENTAR RETO 2 (Bloque de Imagen) --- */}
                <Text style={globalStyles.subtitle}>Imagen:</Text>
                <Image
                    source={{ uri: imagenUri || receta.imagen_url || undefined }}
                    style={styles.vistaPrevia}
                />

                <TouchableOpacity
                    style={[
                        globalStyles.button,
                        globalStyles.buttonSecondary,
                        styles.botonIcono,
                    ]}
                    onPress={handleSeleccionarImagen}
                >
                    <Ionicons name="camera-outline" size={18} color={colors.white} />
                    <Text style={globalStyles.buttonText}>Cambiar Foto</Text>
                </TouchableOpacity>

                {/* --- 10. ELIMINAR NOTA ANTIGUA --- */}
                {/* <Text style={styles.notaImagen}>...</Text> */}

                <TouchableOpacity
                    style={[
                        globalStyles.button,
                        globalStyles.buttonPrimary,
                        styles.botonGuardar,
                    ]}
                    onPress={handleGuardar}
                    disabled={cargando}
                >
                    {cargando ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={globalStyles.buttonText}>Guardar Cambios</Text>
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
    },
    textoError: {
        fontSize: fontSize.lg,
        color: colors.danger,
        textAlign: "center",
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.lg,
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
    // 'textoAgregar' ya no es necesario

    listaIngredientes: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    // 'textoEliminar' ya no es necesario

    // 'notaImagen' ya no es necesario

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
        marginBottom: spacing.md,
        backgroundColor: colors.borderLight, // Fondo por si no carga
    },
    botonGuardar: {
        padding: spacing.lg,
        marginTop: spacing.lg, // Ajustar margen
    },
});