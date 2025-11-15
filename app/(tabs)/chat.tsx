import { Mensaje } from "@/src/domain/models/Mensaje";
import { Conversacion } from "@/src/domain/useCases/chat/ChatUseCase";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { useChat } from "@/src/presentation/hooks/useChat";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { globalStyles } from "@/src/styles/globalStyles";
import { borderRadius, colors, fontSize, spacing } from "@/src/styles/theme";

export default function ChatScreen() {
    const { usuario, esEntrenador } = useAuth();
    const [receptorId, setReceptorId] = useState<string | null>(null);
    const [receptorInfo, setReceptorInfo] = useState<{ email: string; rol: string } | null>(null);
    const [mostrarSelector, setMostrarSelector] = useState(false);
    const [usuariosDisponibles, setUsuariosDisponibles] = useState<Array<{ id: string; email: string; rol: string }>>([]);

    const {
        mensajes,
        conversaciones,
        cargando,
        enviando,
        enviarMensaje,
        quienEscribe,
        notificarEscritura,
        cargarConversaciones,
        obtenerUsuariosDisponibles,
    } = useChat(receptorId || undefined);

    const [textoMensaje, setTextoMensaje] = useState("");
    const flatListRef = useRef<FlatList>(null);

    // Scroll automático cuando llegan mensajes nuevos
    useEffect(() => {
        if (mensajes.length > 0 && receptorId) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [mensajes, receptorId]);

    // Cargar usuarios disponibles para nueva conversación
    const cargarUsuariosDisponibles = async () => {
        const usuarios = await obtenerUsuariosDisponibles();
        setUsuariosDisponibles(usuarios);
        setMostrarSelector(true);
    };

    const seleccionarConversacion = (conv: Conversacion) => {
        setReceptorId(conv.interlocutor_id);
        setReceptorInfo({
            email: conv.interlocutor_email,
            rol: conv.interlocutor_rol,
        });
    };

    const iniciarNuevaConversacion = (usuario: { id: string; email: string; rol: string }) => {
        setReceptorId(usuario.id);
        setReceptorInfo({
            email: usuario.email,
            rol: usuario.rol,
        });
        setMostrarSelector(false);
    };

    const volverAConversaciones = () => {
        setReceptorId(null);
        setReceptorInfo(null);
        cargarConversaciones();
    };

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
        const emailCompleto = item.emisor?.email || "Usuario";
        const nombreUsuario = emailCompleto.split("@")[0];
        const rolUsuario = item.emisor?.rol || "usuario";
        const esEntrenadorMensaje = rolUsuario === "entrenador";

        return (
            <View
                style={[
                    styles.mensajeContainer,
                    esMio ? styles.mensajeMio : styles.mensajeOtro,
                ]}
            >
                {/* ETIQUETA DE USUARIO */}
                {!esMio && (
                    <View style={styles.etiquetaUsuario}>
                        <Ionicons
                            name={esEntrenadorMensaje ? "barbell" : "person"}
                            size={12}
                            color={colors.primary}
                        />
                        <Text style={styles.nombreUsuario}>
                            {esEntrenadorMensaje ? "Entrenador" : "Usuario"}
                        </Text>
                        <Text style={styles.emailUsuario}>({nombreUsuario})</Text>
                    </View>
                )}

                <Text style={[styles.contenidoMensaje, esMio && styles.contenidoMensajeMio]}>
                    {item.contenido}
                </Text>

                <View style={styles.pieMensaje}>
                    <Text style={[styles.horaMensaje, esMio && styles.horaMensajeMio]}>
                        {new Date(item.created_at).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </Text>
                    {esMio && (
                        <Ionicons
                            name={item.leido ? "checkmark-done" : "checkmark"}
                            size={14}
                            color={item.leido ? colors.success : "rgba(255, 255, 255, 0.7)"}
                        />
                    )}
                </View>
            </View>
        );
    };

    const renderConversacion = ({ item }: { item: Conversacion }) => {
        const nombreUsuario = item.interlocutor_email.split("@")[0];
        const esEntrenadorConv = item.interlocutor_rol === "entrenador";
        const tieneNoLeidos = item.mensajes_no_leidos > 0;

        return (
            <TouchableOpacity
                style={styles.conversacionItem}
                onPress={() => seleccionarConversacion(item)}
            >
                <View style={[styles.avatarConversacion, esEntrenadorConv && styles.avatarEntrenador]}>
                    <Ionicons
                        name={esEntrenadorConv ? "barbell" : "person"}
                        size={24}
                        color={colors.white}
                    />
                </View>
                <View style={styles.infoConversacion}>
                    <View style={styles.headerConversacion}>
                        <Text style={styles.nombreConversacion}>
                            {esEntrenadorConv ? "Entrenador" : "Usuario"}
                        </Text>
                        {tieneNoLeidos && (
                            <View style={styles.badgeNoLeidos}>
                                <Text style={styles.textoNoLeidos}>{item.mensajes_no_leidos}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.emailConversacion} numberOfLines={1}>
                        {nombreUsuario}
                    </Text>
                    <Text style={styles.fechaConversacion}>
                        {new Date(item.ultimo_mensaje).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                        })}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
        );
    };

    // PANTALLA: SELECTOR DE NUEVO USUARIO
    if (mostrarSelector) {
        return (
            <View style={globalStyles.container}>
                <View style={styles.headerSelector}>
                    <TouchableOpacity onPress={() => setMostrarSelector(false)}>
                        <Ionicons name="arrow-back" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.tituloSelector}>Nueva Conversación</Text>
                    <View style={{ width: 24 }} />
                </View>

                {usuariosDisponibles.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={60} color={colors.textTertiary} />
                        <Text style={globalStyles.textSecondary}>
                            No hay {esEntrenador ? "usuarios" : "entrenadores"} disponibles
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={usuariosDisponibles}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ padding: spacing.md }}
                        renderItem={({ item }) => {
                            const nombreUsuario = item.email.split("@")[0];
                            const esEntrenadorItem = item.rol === "entrenador";

                            return (
                                <TouchableOpacity
                                    style={styles.usuarioItem}
                                    onPress={() => iniciarNuevaConversacion(item)}
                                >
                                    <View style={[styles.avatarUsuario, esEntrenadorItem && styles.avatarEntrenador]}>
                                        <Ionicons
                                            name={esEntrenadorItem ? "barbell" : "person"}
                                            size={24}
                                            color={colors.white}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.nombreUsuario}>
                                            {esEntrenadorItem ? "Entrenador" : "Usuario"}
                                        </Text>
                                        <Text style={styles.emailConversacion}>{nombreUsuario}</Text>
                                    </View>
                                    <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            );
                        }}
                    />
                )}
            </View>
        );
    }

    // PANTALLA: LISTA DE CONVERSACIONES
    if (!receptorId) {
        return (
            <View style={globalStyles.container}>
                <View style={globalStyles.header}>
                    <Text style={styles.titulo}>Mensajes</Text>
                    <TouchableOpacity
                        style={styles.botonNuevo}
                        onPress={cargarUsuariosDisponibles}
                    >
                        <Ionicons name="create-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {cargando ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : conversaciones.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={80} color={colors.textTertiary} />
                        <Text style={globalStyles.emptyState}>No tienes conversaciones</Text>
                        <TouchableOpacity
                            style={[globalStyles.button, globalStyles.buttonPrimary, { marginTop: spacing.lg }]}
                            onPress={cargarUsuariosDisponibles}
                        >
                            <Ionicons name="add" size={20} color={colors.white} />
                            <Text style={globalStyles.buttonText}> Iniciar Chat</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={conversaciones}
                        keyExtractor={(item) => item.interlocutor_id}
                        renderItem={renderConversacion}
                        contentContainerStyle={{ padding: spacing.md }}
                    />
                )}
            </View>
        );
    }

    // PANTALLA: CHAT ACTIVO
    if (cargando) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.textoCargando}>Cargando mensajes...</Text>
            </View>
        );
    }

    const nombreReceptor = receptorInfo?.email.split("@")[0] || "Usuario";
    const esEntrenadorReceptor = receptorInfo?.rol === "entrenador";

    return (
        <KeyboardAvoidingView
            style={globalStyles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            {/* HEADER DEL CHAT */}
            <View style={styles.headerChat}>
                <TouchableOpacity onPress={volverAConversaciones} style={styles.botonVolver}>
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.avatarHeader}>
                    <Ionicons
                        name={esEntrenadorReceptor ? "barbell" : "person"}
                        size={20}
                        color={colors.white}
                    />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerNombre}>
                        {esEntrenadorReceptor ? "Entrenador" : "Usuario"}
                    </Text>
                    <Text style={styles.headerEmail}>{nombreReceptor}</Text>
                </View>
            </View>

            {/* LISTA DE MENSAJES */}
            <FlatList
                ref={flatListRef}
                data={mensajes}
                renderItem={renderMensaje}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />

            {/* INDICADOR DE ESCRITURA */}
            {quienEscribe && quienEscribe !== usuario?.email && (
                <View style={styles.typingContainer}>
                    <View style={styles.typingContent}>
                        <View style={styles.typingDots}>
                            <View style={[styles.dot, styles.dot1]} />
                            <View style={[styles.dot, styles.dot2]} />
                            <View style={[styles.dot, styles.dot3]} />
                        </View>
                        <Text style={styles.typingText}>
                            {esEntrenadorReceptor ? "Entrenador" : "Usuario"} está escribiendo...
                        </Text>
                    </View>
                </View>
            )}

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
    titulo: {
        fontSize: fontSize.xl,
        fontWeight: "bold",
        color: colors.textPrimary,
    },
    botonNuevo: {
        padding: spacing.sm,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    textoCargando: {
        marginTop: 10,
        fontSize: 16,
        color: "#666",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.xl,
    },
    conversacionItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    avatarConversacion: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.secondary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: spacing.md,
    },
    avatarEntrenador: {
        backgroundColor: colors.primary,
    },
    infoConversacion: {
        flex: 1,
    },
    headerConversacion: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    nombreConversacion: {
        fontSize: fontSize.md,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    emailConversacion: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },
    fechaConversacion: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
        marginTop: 2,
    },
    badgeNoLeidos: {
        backgroundColor: colors.danger,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 6,
    },
    textoNoLeidos: {
        color: colors.white,
        fontSize: fontSize.xs,
        fontWeight: "bold",
    },
    headerSelector: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: spacing.md,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    tituloSelector: {
        fontSize: fontSize.lg,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    usuarioItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    avatarUsuario: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: colors.secondary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: spacing.md,
    },
    headerChat: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    botonVolver: {
        marginRight: spacing.sm,
    },
    avatarHeader: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: spacing.sm,
    },
    headerInfo: {
        flex: 1,
    },
    headerNombre: {
        fontSize: fontSize.md,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    headerEmail: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    listContainer: {
        padding: spacing.md,
    },
    mensajeContainer: {
        maxWidth: "75%",
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    mensajeMio: {
        alignSelf: "flex-end",
        backgroundColor: colors.primary,
    },
    mensajeOtro: {
        alignSelf: "flex-start",
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    etiquetaUsuario: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: spacing.xs,
        paddingBottom: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.1)",
    },
    nombreUsuario: {
        fontSize: fontSize.xs,
        fontWeight: "700",
        color: colors.primary,
    },
    emailUsuario: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        fontStyle: "italic",
    },
    contenidoMensaje: {
        fontSize: fontSize.md,
        color: colors.textPrimary,
        lineHeight: 20,
    },
    contenidoMensajeMio: {
        color: colors.white,
    },
    pieMensaje: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: spacing.xs,
    },
    horaMensaje: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
    },
    horaMensajeMio: {
        color: "rgba(255, 255, 255, 0.7)",
    },
    typingContainer: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    typingContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
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
    dot1: { opacity: 0.4 },
    dot2: { opacity: 0.6 },
    dot3: { opacity: 0.8 },
    typingText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        fontStyle: "italic",
    },
    inputContainer: {
        flexDirection: "row",
        padding: spacing.md,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.background,
        borderRadius: borderRadius.round,
        fontSize: fontSize.md,
    },
    botonEnviar: {
        marginLeft: spacing.sm,
        width: 44,
        height: 44,
        backgroundColor: colors.primary,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    botonDeshabilitado: {
        backgroundColor: colors.borderLight,
    },
});