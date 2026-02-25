import { useCallback, useEffect, useRef } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const STORAGE_KEY = "onboarding_tour_completed";

const steps: DriveStep[] = [
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: "Menu Principal",
      description: "Este é o menu principal. Aqui você acessa todas as áreas da plataforma.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="nav-estrutura"]',
    popover: {
      title: "Estrutura Organizacional",
      description: "Comece cadastrando seus departamentos e cargos.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="nav-colaboradores"]',
    popover: {
      title: "Colaboradores",
      description: "Depois, importe ou cadastre seus colaboradores.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="nav-campanhas"]',
    popover: {
      title: "Campanhas",
      description: "Crie campanhas de avaliação psicossocial para enviar aos colaboradores.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="nav-analises"]',
    popover: {
      title: "Análises",
      description: "Acompanhe os resultados e indicadores em tempo real.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="nav-relatorios"]',
    popover: {
      title: "Relatórios",
      description: "Gere relatórios e laudos automaticamente.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="nav-configuracoes"]',
    popover: {
      title: "Configurações",
      description: "Personalize a plataforma com a identidade da sua empresa.",
      side: "right",
      align: "start",
    },
  },
];

export function useOnboardingTour(ready: boolean) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  const createDriver = useCallback(() => {
    return driver({
      showProgress: true,
      animate: true,
      overlayColor: "hsl(222 47% 11% / 0.75)",
      stagePadding: 6,
      stageRadius: 8,
      popoverClass: "onboarding-tour-popover",
      nextBtnText: "Próximo",
      prevBtnText: "Anterior",
      doneBtnText: "Concluir",
      progressText: "{{current}} de {{total}}",
      steps,
      onDestroyStarted: () => {
        // Only mark as completed if user finished all steps
        if (driverRef.current?.isLastStep()) {
          localStorage.setItem(STORAGE_KEY, "true");
        }
        driverRef.current?.destroy();
      },
    });
  }, []);

  const startTour = useCallback(() => {
    const d = createDriver();
    driverRef.current = d;
    d.drive();
  }, [createDriver]);

  useEffect(() => {
    if (!ready) return;
    const completed = localStorage.getItem(STORAGE_KEY);
    if (completed) return;

    const timeout = setTimeout(() => {
      startTour();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [ready, startTour]);

  return { startTour };
}
