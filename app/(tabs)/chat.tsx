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
} from "react-native";
import { useChat } from "@/src/presentation/hooks/useChat";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { Mensaje } from "@/src/domain/models/Mensaje";
import { Ionicons } from "@expo/vector-icons";

import { globalStyles } from "@/src/styles/globalStyles";
import { colors } from "@/src/styles/theme";

export default function ChatScreen() {
    const {
        mensajes,
        cargando,
        enviando,
        enviarMensaje,
        quienEscribe,
        notificarEscritura,
    } = useChat();
    const { usuario } = useAuth();
    const [textoMensaje, setTextoMensaje] = useState("");
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (mensajes.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [mensajes]);

    const handleEnviar = async () => {
        if (!textoMensaje.trim() || enviando) return;

        const mensaje = textoMensaje;
        setTextoMensaje("");

        const resultado = await enviarMensaje(mensaje);

        if (!resultado.success) {
            alert("Error: " + resultado.error);
            setTextoMensaje(mensaje);
        }
    };

    const renderMensaje = ({ item }: { item: Mensaje }) => {
        const esMio = item.usuario_id === usuario?.id;
        
        // Obtener nombre del usuario (email sin dominio)
        const emailCompleto = item.usuario?.email || "Usuario";
        const nombreUsuario = emailCompleto.split("@")[0];

        return (
            <View
                style={[
                    styles.mensajeContainer,
                    esMio ? styles.mensajeMio : styles.mensajeOtro,
                ]}
            >
                {/* ETIQUETA DE USUARIO - Solo mostrar en mensajes de otros */}
                {!esMio && (
                    <View style={styles.etiquetaUsuario}>
                        <Ionicons 
                            name={item.usuario?.rol === "chef" ? "restaurant" : "person"} 
                            size={12} 
                            color={colors.primary} 
                        />
                        <Text style={styles.nombreUsuario}>{nombreUsuario}</Text>
                        {item.usuario?.rol === "chef" && (
                            <Text style={styles.badgeChef}>Chef</Text>
                        )}
                    </View>
                )}

                <Text style={[
                    styles.contenidoMensaje,
                    esMio && styles.contenidoMensajeMio
                ]}>
                    {item.contenido}
                </Text>

                <Text style={[
                    styles.horaMensaje,
                    esMio && styles.horaMensajeMio
                ]}>
                    {new Date(item.created_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </Text>
            </View>
        );
    };

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
            <FlatList
                ref={flatListRef}
                data={mensajes}
                renderItem={renderMensaje}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            {/* INDICADOR DE ESCRITURA MEJORADO */}
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
    badgeChef: {
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
    horaMensaje: {
        fontSize: 10,
        color: "#999",
        marginTop: 4,
        alignSelf: "flex-end",
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
    // ESTILOS DEL TYPING INDICATOR
    typingContainer: {
        paddingHorizontal: 16,
        minHeight: 30,
        justifyContent: 'center',
    },
    typingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    typingDots: {
        flexDirection: 'row',
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
        fontStyle: 'italic',
    },
});