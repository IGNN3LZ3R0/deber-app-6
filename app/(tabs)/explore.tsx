import { View } from "react-native";

// Este es un componente "fantasma"
// Sirve solo para que Expo Router muestre la pestaña.
// Nunca se verá, porque el "listener" en el layout
// intercepta el clic y nos redirige.
export default function ExploreScreen() {
    return <View />;
}