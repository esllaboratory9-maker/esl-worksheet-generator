"use client";

import { useState } from "react";
import Logo from "@/components/Logo";
import StepIndicator from "@/components/StepIndicator";
import Step1 from "@/components/Step1";
import Step2 from "@/components/Step2";
import Step3 from "@/components/Step3";
import Step4 from "@/components/Step4";
import Step5 from "@/components/Step5";
import { AppState, Angle } from "@/lib/types";

const INITIAL_STATE: AppState & { angles?: Angle[] } = {
  step: 1,
  inputMode: "topic",
  topic: "",
  level: "",
  selectedAngles: [],
  vocabulary: [],
  worksheetMarkdown: "",
  exercises: [],
};

export default function Home() {
  const [state, setState] = useState<AppState & { angles?: Angle[] }>(INITIAL_STATE);

  const update = (updates: Partial<AppState & { angles: Angle[] }>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const goBack = () => {
    setState((prev) => ({
      ...prev,
      step: (Math.max(1, prev.step - 1) as AppState["step"]),
    }));
  };

  const restart = () => setState(INITIAL_STATE);

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA" }}>
      {/* Header */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #E5E7EB",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          height: 60,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            width: "100%",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Logo />
          <div style={{ width: 1, height: 28, background: "#E5E7EB" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Worksheet Generator</span>
        </div>
      </header>

      {/* Step indicator */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #E5E7EB",
          padding: "20px 32px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <StepIndicator current={state.step} />
        </div>
      </div>

      {/* Content */}
      <main style={{ padding: "40px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {state.step === 1 && <Step1 state={state} onNext={update} />}
          {state.step === 2 && state.angles && (
            <Step2
              state={state as AppState & { angles: Angle[] }}
              onNext={update}
              onBack={goBack}
            />
          )}
          {state.step === 3 && (
            <Step3 state={state} onNext={update} onBack={goBack} />
          )}
          {state.step === 4 && (
            <Step4 state={state} onNext={update} onBack={goBack} />
          )}
          {state.step === 5 && (
            <Step5 state={state} onBack={goBack} onRestart={restart} />
          )}
        </div>
      </main>
    </div>
  );
}
