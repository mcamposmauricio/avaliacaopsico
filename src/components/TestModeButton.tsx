import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FlaskConical, Loader2 } from "lucide-react";

interface TestModeButtonProps {
  label: string;
  onExecute: () => Promise<void>;
}

export function TestModeButton({ label, onExecute }: TestModeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onExecute();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-red-500/50 rounded-xl bg-red-600/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Modo de Teste</span>
      </div>
      <Button
        onClick={handleClick}
        disabled={loading}
        className="bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-lg px-6 py-4 rounded-xl shadow-lg border-2 border-red-500 h-auto w-full gap-3"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FlaskConical className="h-5 w-5" />}
        {label}
      </Button>
    </div>
  );
}
