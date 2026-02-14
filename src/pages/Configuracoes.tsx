import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Upload, X } from "lucide-react";

export default function Configuracoes() {
  const { tenant, tenantId } = useTenant();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    primary_color: "#1e3a5f",
    secondary_color: "#64748b",
    min_group_size: 7,
    data_retention_days: 1825,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name,
        primary_color: tenant.primary_color || "#1e3a5f",
        secondary_color: tenant.secondary_color || "#64748b",
        min_group_size: tenant.min_group_size,
        data_retention_days: tenant.data_retention_days || 1825,
      });
      setLogoPreview(tenant.logo_url || null);
    }
  }, [tenant]);

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop();
      const path = `${tenantId}/logo.${ext}`;
      const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
      const logoUrl = urlData.publicUrl;
      const { error: updateErr } = await supabase.from("tenants").update({ logo_url: logoUrl }).eq("id", tenantId);
      if (updateErr) throw updateErr;
      return logoUrl;
    },
    onSuccess: (url) => {
      setLogoPreview(url);
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
      toast.success("Logo atualizado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeLogo = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tenants").update({ logo_url: null }).eq("id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      setLogoPreview(null);
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
      toast.success("Logo removido");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tenants")
        .update({
          name: form.name,
          primary_color: form.primary_color,
          secondary_color: form.secondary_color,
          min_group_size: form.min_group_size,
          data_retention_days: form.data_retention_days,
        })
        .eq("id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
      toast.success("Configurações salvas");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadLogo.mutate(file);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Logo da Empresa</CardTitle>
          <CardDescription>Carregue o logo para personalizar o sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <div className="relative">
                <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-lg object-contain border" />
                <button onClick={() => removeLogo.mutate()} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">
                AP
              </div>
            )}
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadLogo.isPending}>
                <Upload className="h-4 w-4 mr-1" />{uploadLogo.isPending ? "Enviando..." : "Carregar Logo"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identidade Visual (White Label)</CardTitle>
          <CardDescription>Personalize a aparência do sistema para sua empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Empresa</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cor Primária</Label>
              <div className="flex gap-2">
                <Input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="w-14 h-10 p-1" />
                <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor Secundária</Label>
              <div className="flex gap-2">
                <Input type="color" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} className="w-14 h-10 p-1" />
                <Input value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Política de Anonimato</CardTitle>
          <CardDescription>Configure as regras de anonimização dos dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tamanho mínimo do grupo (N mínimo)</Label>
            <Input type="number" min={3} value={form.min_group_size} onChange={(e) => setForm({ ...form, min_group_size: parseInt(e.target.value) || 7 })} />
            <p className="text-xs text-muted-foreground">Resultados de grupos com menos respondentes que este valor serão suprimidos para garantir o anonimato.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retenção de Dados (LGPD)</CardTitle>
          <CardDescription>Defina por quanto tempo os dados serão mantidos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Dias de retenção</Label>
            <Input type="number" min={365} value={form.data_retention_days} onChange={(e) => setForm({ ...form, data_retention_days: parseInt(e.target.value) || 1825 })} />
            <p className="text-xs text-muted-foreground">Após este período, dados pessoais (PII) serão removidos. Dados agregados são preservados. Padrão: 1825 dias (5 anos).</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="gap-2">
        <Save className="h-4 w-4" />Salvar Configurações
      </Button>
    </div>
  );
}
