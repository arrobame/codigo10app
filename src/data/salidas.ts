// "dispatch" = Alfa (rojo, izquierda)
// "command"  = K2/K4/jefatura (amarillo, izquierda)
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
  // ─── ESCENARIOS INTRODUCTORIOS ──────────────────────────────────────────────

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

  // ─── ESCENARIOS COMPLETOS ────────────────────────────────────────────────────

  {
    id: "accidente_vehicular_completo",
    title: "Accidente vehicular — servicio completo",
    description: "Ciclo completo: salida, pre-informe en el lugar, traslado al hospital e informe final.",
    emoji: "🚗",
    category: "Accidente",
    steps: [
      // SALIDA
      {
        speaker: "AM-02",
        side: "mobile",
        message: "Alfa, móvil AM-02.",
        note: "El móvil llama a Alfa para reportar su salida. Primero quién se llama, luego quién llama.",
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
        message: "10-23 al 10-78 para 10-41 vehicular. 10-30 VBC-3197. 10-31 VBC-4521. 10-32 3.",
        note: "Se dirige (10-23) al servicio (10-78) por un accidente vehicular (10-41). Informa conductor (10-30), oficial a cargo (10-31) y cantidad de tripulantes (10-32).",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "10-04.",
        note: "Alfa confirma que recibió y comprendió el reporte de salida.",
      },
      // 10-46: LLEGADA AL LUGAR
      {
        speaker: "AM-02",
        side: "mobile",
        message: "Alfa, móvil AM-02.",
        note: "El móvil llama nuevamente para dar el pre-informe (10-46) al llegar al lugar.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "Adelante.",
        note: "Alfa autoriza al móvil a transmitir el pre-informe.",
      },
      {
        speaker: "AM-02",
        side: "mobile",
        message: "En el 10-17, 10-46. Se observa vehículo colisionado y 1 persona tendida en vía pública. En breve 10-47.",
        note: "Pre-informe (10-46): describe brevemente lo que ve al llegar. Anticipa que pronto dará la ampliación (10-47) tras evaluar al herido.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "10-04.",
        note: "Alfa acusa recibo del pre-informe.",
      },
      // 10-47: AMPLIACIÓN / TRASLADO
      {
        speaker: "AM-02",
        side: "mobile",
        message: "Alfa, móvil AM-02.",
        note: "El móvil llama para dar la ampliación de informe (10-47) luego de evaluar al herido.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "Adelante.",
        note: "Alfa autoriza la ampliación.",
      },
      {
        speaker: "AM-02",
        side: "mobile",
        message: "10-47. 1 10-44, masculino, mayor de edad, con aparente fractura en miembro inferior izquierdo. Trasladado por 10-90 de este móvil. 10-23 a H1.",
        note: "Ampliación (10-47): 1 herido (10-44), sexo, edad y lesión observada. El personal del móvil (10-90) realiza el traslado al hospital H1.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "10-04.",
        note: "Alfa acusa recibo de la ampliación y el traslado.",
      },
      // 10-48: INFORME FINAL
      {
        speaker: "AM-02",
        side: "mobile",
        message: "Alfa, móvil AM-02.",
        note: "El móvil llama para dar el informe final (10-48) al entregar al herido en el hospital.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "Adelante.",
        note: "Alfa autoriza el informe final.",
      },
      {
        speaker: "AM-02",
        side: "mobile",
        message: "10-48. 10-44 queda a cargo de 10-99 de H1. 10-23 K1.",
        note: "Informe final (10-48): el herido (10-44) queda bajo responsabilidad del médico de guardia (10-99) de H1. El móvil regresa a su compañía K1.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "10-04.",
        note: "Alfa acusa recibo del informe final.",
      },
      // REGRESO A BASE
      {
        speaker: "AM-02",
        side: "mobile",
        message: "Alfa, móvil AM-02.",
        note: "Última llamada para reportar la llegada a base.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "Adelante.",
        note: "Alfa autoriza la última transmisión.",
      },
      {
        speaker: "AM-02",
        side: "mobile",
        message: "10-20. 10-26 56.789. 10-75. 10-12.",
        note: "El móvil está en base (10-20), informa el kilometraje (10-26: 56.789 km), queda disponible para nuevo servicio (10-75) y finaliza la transmisión (10-12).",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "10-04. 10-12.",
        note: "Alfa acusa recibo y cierra la transmisión (10-12). Fin del servicio.",
      },
    ],
  },

  {
    id: "accidente_moto_k4",
    title: "Accidente motociclista — despacho desde Alfa",
    description: "Alfa despacha a K4, el móvil AM-04 reporta todo el ciclo hasta volver a base.",
    emoji: "🚨",
    category: "Accidente",
    steps: [
      // DESPACHO
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "Atento K4. 10-75 para 10-41 motociclista.",
        note: "Alfa inicia el despacho llamando a la compañía K4. Le indica que debe estar listo (10-75) para un accidente de moto (10-41).",
      },
      {
        speaker: "K4",
        side: "command",
        message: "10-04, móvil se dirige.",
        note: "La jefatura K4 acusa recibo (10-04) e informa que el móvil ya está saliendo.",
      },
      // SALIDA
      {
        speaker: "AM-04",
        side: "mobile",
        message: "Alfa, móvil AM-04.",
        note: "El móvil asignado llama a Alfa para reportar su salida.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "Adelante.",
        note: "Alfa autoriza al móvil AM-04 a transmitir.",
      },
      {
        speaker: "AM-04",
        side: "mobile",
        message: "10-23 al 10-78. 10-30 VBC-0815. 10-31 C42. 10-32 3.",
        note: "Se dirige (10-23) al servicio (10-78). Conductor VBC-0815 (10-30), oficial a cargo C42 (10-31) y 3 tripulantes (10-32).",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "10-04.",
        note: "Alfa confirma la salida del móvil.",
      },
      // 10-46: LLEGADA
      {
        speaker: "AM-04",
        side: "mobile",
        message: "Alfa, móvil AM-04.",
        note: "El móvil llegó al lugar y llama para dar el pre-informe (10-46).",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "Adelante.",
        note: "Alfa autoriza el pre-informe.",
      },
      {
        speaker: "AM-04",
        side: "mobile",
        message: "10-46. 10-44, sexo masculino, mayoría de edad, tendido en vía pública. Se procede a su asistencia.",
        note: "Pre-informe (10-46): describe al herido (10-44) con sexo y edad aproximada. Informa que comenzará a asistirlo.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "10-04.",
        note: "Alfa acusa recibo del pre-informe.",
      },
      // 10-47: TRASLADO
      {
        speaker: "AM-04",
        side: "mobile",
        message: "Alfa, móvil AM-04.",
        note: "Llama para la ampliación de informe (10-47) tras evaluar al herido.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "Adelante.",
        note: "Alfa autoriza la ampliación.",
      },
      {
        speaker: "AM-04",
        side: "mobile",
        message: "10-47. 10-44 con posible fractura, miembro superior derecho. A bordo. 10-23 Hospital General de Luque.",
        note: "Ampliación (10-47): herido (10-44) con posible fractura en brazo derecho. \"A bordo\" significa que ya está dentro del móvil. Se dirige al Hospital General de Luque.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "10-04.",
        note: "Alfa acusa recibo del traslado.",
      },
      // 10-48: INFORME FINAL
      {
        speaker: "AM-04",
        side: "mobile",
        message: "Alfa, móvil AM-04.",
        note: "El móvil llegó al hospital y llama para dar el informe final (10-48).",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "Adelante.",
        note: "Alfa autoriza el informe final.",
      },
      {
        speaker: "AM-04",
        side: "mobile",
        message: "10-48. 10-41 motociclista. 10-44, sexo masculino, mayor edad, posible fractura miembro superior derecho. Queda a cargo 10-99, Hospital General de Luque. 10-23 K4.",
        note: "Informe final completo (10-48): repite el tipo de servicio (10-41), describe al herido y la lesión. Confirma que queda bajo el médico de guardia (10-99). Regresa a su compañía K4.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "10-04.",
        note: "Alfa acusa recibo del informe final.",
      },
      // REGRESO A BASE
      {
        speaker: "AM-04",
        side: "mobile",
        message: "Alfa, móvil AM-04.",
        note: "Última comunicación para reportar el regreso a base.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "Adelante.",
        note: "Alfa autoriza la última transmisión.",
      },
      {
        speaker: "AM-04",
        side: "mobile",
        message: "10-20. 10-26 120.240.",
        note: "El móvil está en base (10-20) e informa el kilometraje recorrido (10-26: 120.240 km). Fin del servicio.",
      },
      {
        speaker: "Alfa",
        side: "dispatch",
        message: "10-04.",
        note: "Alfa acusa recibo. Servicio cerrado.",
      },
    ],
  },
];
