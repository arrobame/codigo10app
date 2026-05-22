import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "cbvp_nemotecnias";

export async function getCustomNemotecnias(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function setCustomNemotecnia(codigo: string, text: string): Promise<void> {
  try {
    const data = await getCustomNemotecnias();
    data[codigo] = text.trim();
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export async function deleteCustomNemotecnia(codigo: string): Promise<void> {
  try {
    const data = await getCustomNemotecnias();
    delete data[codigo];
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}
