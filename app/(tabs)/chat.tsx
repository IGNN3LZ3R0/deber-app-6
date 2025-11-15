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

// 1. IMPORTA TUS ESTILOS GLOBALES
import { globalStyles } from "@/src/styles/globalStyles";
// 2. (OPCIONAL) IMPORTA LOS COLORES PARA LOS BOTONES
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

    // Auto-scroll al final cuando llegan nuevos mensajes
    useEffect(() => {
        if (mensajes.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [mensajes]);

    const handleEnviar = async () => {
        if (!textoMensaje.trim() || enviando) return;

        const mensaje = textoMensaje;
        setTextoMensaje(""); // Limpiar input inmediatamente

        const resultado = await enviarMensaje(mensaje);

        if (!resultado.success) {
            alert("Error: " + resultado.error);
            setTextoMensaje(mensaje); // Restaurar mensaje si falló
        }
    };

    const renderMensaje = ({ item }: { item: Mensaje }) => {
        const esMio = item.usuario_id === usuario?.id;
        const emailUsuario = item.usuario?.email || "Usuario desconocido";

        return (
            <View
                style={[
                    styles.mensajeContainer,
                    esMio ? styles.mensajeMio : styles.mensajeOtro,
                ]}
            >
                {!esMio && (
                    <Text style={styles.nombreUsuario}>{emailUsuario}</Text>
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
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.textoCargando}>Cargando mensajes...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={globalStyles.container} // Reemplaza styles.container
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

            <View style={styles.typingContainer}>
                {/* Solo lo mostramos si alguien escribe Y no somos nosotros mismos */}
                {quienEscribe && quienEscribe !== usuario?.email && (
                    <Text style={styles.typingText}>{quienEscribe} está escribiendo...</Text>
                )}
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={textoMensaje}
                    // 3. LLAMAMOS A LA NOTIFICACIÓN AL ESCRIBIR
                    onChangeText={(texto) => {
                        setTextoMensaje(texto);
                        if (usuario?.email) {
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
                    <Text style={styles.textoBotonEnviar}>
                        {enviando ? "..." : "Enviar"}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    // 'container' ya no es necesario aquí, lo toma de globalStyles
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
        backgroundColor: colors.primary, // Usar tu color primario
    },
    mensajeOtro: {
        alignSelf: "flex-start",
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    nombreUsuario: {
        fontSize: 12,
        fontWeight: "600",
        color: "#666",
        marginBottom: 4,
    },
    contenidoMensaje: {
        fontSize: 16,
        color: "#000",
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
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: colors.primary, // Usar tu color primario
        borderRadius: 20,
        justifyContent: "center",
    },
    botonDeshabilitado: {
        backgroundColor: "#CCC",
    },
    textoBotonEnviar: {
        color: "#FFF",
        fontWeight: "600",
        fontSize: 16,
    },
    // Estilos para el indicador
    typingContainer: {
        paddingHorizontal: 16,
        height: 20, // Damos altura fija para que no salte la UI
        justifyContent: 'center',
    },
    typingText: {
        fontSize: 12,
        color: "#999",
        fontStyle: 'italic',
    },
});