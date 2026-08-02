"use client";
import { useEffect, useState } from "react";

export function useOpenCV() {
  const [cv, setCv] = useState<any>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let montado = true;

    import("@techstark/opencv-js").then((modulo: any) => {
      // Alguns bundlers expõem o objeto cv em .default, outros no próprio módulo
      const cvInstancia = modulo.default ?? modulo;

      if (!cvInstancia) {
        console.error("Não foi possível carregar o módulo do OpenCV.");
        return;
      }

      // Se já estiver pronto (raro, mas possível), usa direto
      if (typeof cvInstancia.Mat === "function") {
        if (montado) { setCv(cvInstancia); setPronto(true); }
        return;
      }

      cvInstancia.onRuntimeInitialized = () => {
        if (montado) { setCv(cvInstancia); setPronto(true); }
      };
    });

    return () => { montado = false; };
  }, []);

  return { cv, pronto };
}