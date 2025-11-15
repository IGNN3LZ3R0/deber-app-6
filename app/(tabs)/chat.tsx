import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useChat } from "@/src/presentation/hooks/useChat";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { Mensaje } from "@/src/domain/models/Mensaje";
import { Ionicons } from "@expo/vector-icons";

import { globalStyles } from "@/src/styles/globalStyles";
import { colors } from "@/src/styles/theme";

export default function ChatScreen() {
    const { usuario, esEntrenador } = useAuth();
    
    // ESTADO PARA RECEPTOR (ID del usuario con quien chatear)
    // TODO: Implementar selección de receptor
    // Por ahora, mostrar mensaje informativo
    const [receptorId, setReceptorId] = useState<string | null>(null);

    const {
        mensajes,
        cargando,
        enviando,
        enviarMensaje,
        quienEscribe,
        notificarEscritura,
    } = useChat(receptorId || undefined);

    const [textoMensaje, setTextoMensaje] = useState("");
    const flatListRef = useRef<FlatList>(null);

    // Scroll automático cuando llegan mensajes nuevos
    useEffect(() => {
        if (mensajes.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [mensajes]);

    const handleEnviar = async () => {
        if (!textoMensaje.trim() || enviando) return;

        if (!receptorId) {
            Alert.alert("Error", "No hay un receptor seleccionado");
            return;
        }

        const mensaje = textoMensaje;
        setTextoMensaje("");

        const resultado = await enviarMensaje(mensaje);

        if (!resultado.success) {
            Alert.alert("Error", resultado.error || "No se pudo enviar el mensaje");
            setTextoMensaje(mensaje);
        }
    };

    const renderMensaje = ({ item }: { item: Mensaje }) => {
        const esMio = item.emisor_id === usuario?.id;

        // Obtener nombre del usuario
        const emailCompleto = item.emisor?.email || "Usuario";
        const nombreUsuario = emailCompleto.split("@")[0];

        return (
            <View
                style={[
                    styles.mensajeContainer,
                    esMio ? styles.mensajeMio : styles.mensajeOtro,
                ]}
            >
                {/* ETIQUETA DE USUARIO - Solo en mensajes de otros */}
                {!esMio && (
                    <View style={styles.etiquetaUsuario}>
                        <Ionicons
                            name={item.emisor?.rol === "entrenador" ? "barbell" : "person"}
                            size={12}
                            color={colors.primary}
                        />
                        <Text style={styles.nombreUsuario}>{nombreUsuario}</Text>
                        {item.emisor?.rol === "entrenador" && (
                            <Text style={styles.badgeEntrenador}>Entrenador</Text>
                        )}
                    </View>
                )}

                <Text
                    style={[
                        styles.contenidoMensaje,
                        esMio && styles.contenidoMensajeMio,
                    ]}
                >
                    {item.contenido}
                </Text>

                <View style={styles.pieMensaje}>
                    <Text
                        style={[
                            styles.horaMensaje,
                            esMio && styles.horaMensajeMio,
                        ]}
                    >
                        {new Date(item.created_at).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </Text>
                    {esMio && !item.leido && (
                        <Ionicons
                            name="checkmark"
                            size={12}
                            color="rgba(255, 255, 255, 0.7)"
                        />
                    )}
                    {esMio && item.leido && (
                        <Ionicons
                            name="checkmark-done"
                            size={12}
                            color={colors.success}
                        />
                    )}
                </View>
            </View>
        );
    };

    // SI NO HAY RECEPTOR, MOSTRAR PANTALLA DE SELECCIÓN
    if (!receptorId) {
        return (
            <View style={globalStyles.containerCentered}>
                <Ionicons
                    name="chatbubbles-outline"
                    size={80}
                    color={colors.textTertiary}
                />
                <Text style={styles.tituloSeleccion}>Chat</Text>
                <Text style={[globalStyles.textSecondary, { textAlign: "center" }]}>
                    {esEntrenador
                        ? "Próximamente: Podrás chatear con tus usuarios"
                        : "Próximamente: Podrás chatear con tu entrenador"}
                </Text>
                <View style={styles.infoBox}>
                    <Ionicons
                        name="information-circle-outline"
                        size={20}
                        color={colors.primary}
                    />
                    <Text style={styles.infoTexto}>
                        Esta funcionalidad permitirá comunicación en tiempo real entre
                        entrenadores y usuarios
                    </Text>
                </View>
                {/* BOTÓN TEMPORAL PARA TESTING (QUITAR EN PRODUCCIÓN) */}
                {/* <TouchableOpacity
                    style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: 20 }]}
                    onPress={() => {
                        // Para testing, puedes poner un ID temporal
                        Alert.prompt(
                            "Testing Chat",
                            "Ingresa un ID de usuario para chatear:",
                            (text) => {
                                if (text.trim()) {
                                    setReceptorId(text.trim());
                                }
                            }
                        );
                    }}
                >
                    <Text style={globalStyles.buttonText}>🧪 Test Chat (Dev Only)</Text>
                </TouchableOpacity> */}
            </View>
        );
    }

    // PANTALLA DE CHAT ACTIVO
    if (cargando) {
        return (
            <View style={styles.centrado}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.textoCargando}>Cargando mensajes...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={globalStyles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        >
            {/* HEADER DEL CHAT */}
            <View style={styles.headerChat}>
                <TouchableOpacity
                    onPress={() => setReceptorId(null)}
                    style={styles.botonVolver}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerNombre}>
                        {esEntrenador ? "Usuario" : "Entrenador"}
                    </Text>
                    <Text style={styles.headerEstado}>En línea</Text>
                </View>
                <View style={styles.headerAcciones}>
                    <Ionicons
                        name="ellipsis-vertical"
                        size={24}
                        color={colors.textSecondary}
                    />
                </View>
            </View>

            {/* LISTA DE MENSAJES */}
            <FlatList
                ref={flatListRef}
                data={mensajes}
                renderItem={renderMensaje}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            {/* INDICADOR DE ESCRITURA */}
            <View style={styles.typingContainer}>
                {quienEscribe && quienEscribe !== usuario?.email && (
                    <View style={styles.typingContent}>
                        <View style={styles.typingDots}>
                            <View style={[styles.dot, styles.dot1]} />
                            <View style={[styles.dot, styles.dot2]} />
                            <View style={[styles.dot, styles.dot3]} />
                        </View>
                        <Text style={styles.typingText}>
                            {quienEscribe.split("@")[0]} está escribiendo...
                        </Text>
                    </View>
                )}
            </View>

            {/* INPUT DE MENSAJE */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={textoMensaje}
                    onChangeText={(texto) => {
                        setTextoMensaje(texto);
                        if (usuario?.email && texto.trim()) {
                            notificarEscritura(usuario.email);
                        }
                    }}
                    placeholder="Escribe un mensaje..."
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[
                        styles.botonEnviar,
                        (!textoMensaje.trim() || enviando) && styles.botonDeshabilitado,
                    ]}
                    onPress={handleEnviar}
                    disabled={!textoMensaje.trim() || enviando}
                >
                    {enviando ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Ionicons name="send" size={20} color="#FFF" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    centrado: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    textoCargando: {
        marginTop: 10,
        fontSize: 16,
        color: "#666",
    },
    tituloSeleccion: {
        fontSize: 24,
        fontWeight: "bold",
        color: colors.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    infoBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        backgroundColor: colors.primaryLight,
        padding: 16,
        borderRadius: 12,
        marginTop: 24,
        maxWidth: "90%",
    },
    infoTexto: {
        flex: 1,
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    headerChat: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    botonVolver: {
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    headerNombre: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    headerEstado: {
        fontSize: 12,
        color: colors.success,
    },
    headerAcciones: {
        padding: 8,
    },
    listContainer: {
        padding: 16,
    },
    mensajeContainer: {
        maxWidth: "75%",
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
    },
    mensajeMio: {
        alignSelf: "flex-end",
        backgroundColor: colors.primary,
    },
    mensajeOtro: {
        alignSelf: "flex-start",
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    etiquetaUsuario: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 6,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.1)",
    },
    nombreUsuario: {
        fontSize: 11,
        fontWeight: "700",
        color: colors.primary,
    },
    badgeEntrenador: {
        fontSize: 9,
        fontWeight: "600",
        color: "#FFF",
        backgroundColor: colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 4,
    },
    contenidoMensaje: {
        fontSize: 16,
        color: "#000",
        lineHeight: 20,
    },
    contenidoMensajeMio: {
        color: "#FFF",
    },
    pieMensaje: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
    },
    horaMensaje: {
        fontSize: 10,
        color: "#999",
    },
    horaMensajeMio: {
        color: "rgba(255, 255, 255, 0.7)",
    },
    inputContainer: {
        flexDirection: "row",
        padding: 12,
        backgroundColor: "#FFF",
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: "#F5F5F5",
        borderRadius: 20,
        fontSize: 16,
    },
    botonEnviar: {
        marginLeft: 8,
        width: 44,
        height: 44,
        backgroundColor: colors.primary,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    botonDeshabilitado: {
        backgroundColor: "#CCC",
    },
    typingContainer: {
        paddingHorizontal: 16,
        minHeight: 30,
        justifyContent: "center",
    },
    typingContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    typingDots: {
        flexDirection: "row",
        gap: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primary,
    },
    dot1: {
        opacity: 0.4,
    },
    dot2: {
        opacity: 0.6,
    },
    dot3: {
        opacity: 0.8,
    },
    typingText: {
        fontSize: 12,
        color: "#666",
        fontStyle: "italic",
    },
});