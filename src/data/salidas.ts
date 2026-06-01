// "dispatch" = Alfa (rojo, izquierda)
// "command"  = K2/jefatura (amarillo, izquierda)
// "mobile"   = móvil (amarillo, derecha)
export type SalidaSide = "dispatch" | "command" | "mobile";

export interface SalidaStep {
  speaker: string;
  side: SalidaSide;
  message: string; // códigos en formato "10-XX"
  note: string;    // explicación del paso para el aprendiz
}

export interface Salida {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: string;
  steps: SalidaStep[];
}

export const salidas: Salida[] = [
  {
    id: "accidente_via_central",
    title: "Salida accidente vial desde Alfa",
    description: "Salida de móvil de la compañía para un accidente reportado por Alfa.",
    emoji: "🚑",
    category: "Accidente",
    steps: [
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "K2, Alfa.",
        note: "Alfa inicia contacto con la compañia (en el ejemplo K2). En radio siempre se nombra primero a quién se llama, luego quién llama.",
      },
      {
        speaker: "K2",
        side: "mobile",
        message: "Adelante.",
        note: "K2 autoriza a Alfa a transmitir su mensaje.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "10-75 para 10-41 motociclista, 10-17 Julio Correa y Santísima Trinidad.",
        note: "Hay un móvil 10-75 (listo) para atender un 10-41 (accidente) de moto en esa intersección.",
      },
      {
        speaker: "K2",
        side: "mobile",
        message: "10-04, móvil se dirige.",
        note: "K2 confirma con 10-04 (comprendido) e informa que el móvil ya está en camino.",
      },
      {
        speaker: "AM-02",
        side: "mobile",
        message: "Alfa, móvil AM-02.",
        note: "El móvil AM-02 llama a Alfa para reportar su salida. Primero nombra a quién llama, luego se identifica.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "Adelante.",
        note: "Alfa autoriza al móvil a transmitir.",
      },
      {
        speaker: "AM-02",
        side: "mobile",
        message: "10-23 al 10-78. 10-30 VBC-48999. 10-31 VBC-58999. 10-32 3.",
        note: "Se dirige al servicio. Conductor: VBC-48999. A cargo: VBC-58999. Tripulantes: 3.",
      },
    ],
  },
  {
    id: "accidente_civil",
    title: "Salida accidente vial desde persona ajena",
    description: "Salida de móvil para servicio denunciado por persona ajena a la institución.",
    emoji: "🏍️",
    category: "Accidente",
    steps: [
      {
        speaker: "AM-01",
        side: "mobile",
        message: "Alfa, móvil AM-01.",
        note: "El móvil ya tiene información porque lo contactó una persona ajena (10-16). Llama a Alfa para reportar.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "Adelante.",
        note: "Alfa autoriza al móvil a transmitir.",
      },
      {
        speaker: "AM-01",
        side: "mobile",
        message: "10-23 para 10-41 motociclista, denunciado por 10-16. 10-17 Curupayty y Kostianovsky. Conductor: VBC-48999. A cargo: VBC-58999. Tripulantes: 3.",
        note: "Se dirige a un accidente de moto, denunciado por persona ajena. Dirección exacta Curupayty y Kostianovsky.",
      },
    ],
  },
];
