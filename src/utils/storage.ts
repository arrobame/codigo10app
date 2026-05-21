import AsyncStorage from "@react-native-async-storage/async-storage";

const ERRORS_KEY = "cbvp_errors";

export async function addError(codigo: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(ERRORS_KEY);
    const data: Record<string, number> = raw ? JSON.parse(raw) : {};
    data[codigo] = (data[codigo] || 0) + 1;
    await AsyncStorage.setItem(ERRORS_KEY, JSON.stringify(data));
  } catch {}
}

export async function getErrors(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(ERRORS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function clearErrors(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ERRORS_KEY);
  } catch {}
}
