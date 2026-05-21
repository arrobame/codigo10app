import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../types";

export function useHomeBack() {
  const navigation = useNavigation<NavigationProp>();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web") {
        // Empuja una entrada extra para que el browser tenga algo que "consumir"
        // cuando el usuario presiona atrás, sin salir de la app
        window.history.pushState(null, "", window.location.href);

        const handle = () => {
          // Vuelve a empujar para bloquear la salida
          window.history.pushState(null, "", window.location.href);
          navigation.reset({ index: 0, routes: [{ name: "Home" }] });
        };

        window.addEventListener("popstate", handle);
        return () => window.removeEventListener("popstate", handle);
      }

      // Android nativo
      const handler = BackHandler.addEventListener("hardwareBackPress", () => {
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
        return true;
      });
      return () => handler.remove();
    }, [navigation])
  );
}
