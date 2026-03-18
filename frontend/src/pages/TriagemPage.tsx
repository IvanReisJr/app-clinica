import { useState, useEffect } from "react";
import { Activity, ThermometerSun, Weight, Ruler, Heart, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface TriageItem {
  id: string;
  appointment_time: string;
  attendance_number: number | null;
  room: string | null;
  patients: { id: string; name: string; medical_record_number: number | null } | null;
  professionals: { name: string } | null;
}

export default function TriagemPage() {
  const [items, setItems] = useState<TriageItem[]>([]);
  const [selected, setSelected] = useState<TriageItem | null>(null);
  const [form, setForm] = useState({ blood_pressure: "", temperature: "", weight: "", height: "", saturation: "", observations: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchItems = async () => {
    const today = new Date().toISOString().split("T")[0];
    try {
      const response = await apiClient.get(`/appointments/?date=${today}&status=triagem`);
      setItems(response.data.results || response.data);
    } catch (error) {
      console.error("Erro ao carregar triagens", error);
    }
  };

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveTriage = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.post("/triages/", {
        appointment: selected.id,
        patient: selected.patients?.id || null,
        blood_pressure: form.blood_pressure || null,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        height: form.height ? parseFloat(form.height) : null,
        saturation: form.saturation ? parseInt(form.saturation) : null,
        observations: form.observations || null,
      });
      // Atualizar status do agendamento para aguardando
      await apiClient.patch(`/appointments/${selected.id}/`, { status: "aguardando" });
      
      setSaving(false);
      setSelected(null);
      setForm({ blood_pressure: "", temperature: "", weight: "", height: "", saturation: "", observations: "" });
      fetchItems();
      toast({ title: "Triagem concluída", description: "Paciente encaminhado para fila do médico." });
    } catch (error: any) {
      setSaving(false);
      toast({ title: "Erro", description: error.response?.data?.detail || error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="module-header">
        <h1 className="module-title flex items-center gap-2"><Activity className="h-6 w-6 text-purple-600" />Triagem</h1>
        <Badge variant="secondary">{items.length} aguardando triagem</Badge>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum paciente aguardando triagem.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <div key={item.id} className="stat-card border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelected(item)}>
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px]">Triagem</Badge>
                {item.attendance_number && <span className="text-xs text-muted-foreground">#{item.attendance_number}</span>}
              </div>
              <p className="font-semibold">{item.patients?.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span>🕐 {item.appointment_time?.slice(0, 5)}</span>
                <span>{item.professionals?.name}</span>
              </div>
              <Button size="sm" className="mt-3 w-full text-xs bg-purple-600 hover:bg-purple-700">
                <Activity className="h-3 w-3 mr-1" />Realizar Triagem
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Triagem — {selected?.patients?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="flex items-center gap-1"><Heart className="h-3 w-3 text-destructive" />Pressão Arterial</Label>
                <Input placeholder="120/80" value={form.blood_pressure} onChange={e => setForm({ ...form, blood_pressure: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1"><ThermometerSun className="h-3 w-3 text-warning" />Temperatura (°C)</Label>
                <Input type="number" step="0.1" placeholder="36.5" value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="flex items-center gap-1"><Weight className="h-3 w-3" />Peso (kg)</Label>
                <Input type="number" step="0.1" placeholder="70.0" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1"><Ruler className="h-3 w-3" />Altura (cm)</Label>
                <Input type="number" step="0.1" placeholder="170" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Saturação (%)</Label>
                <Input type="number" placeholder="98" value={form.saturation} onChange={e => setForm({ ...form, saturation: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea rows={3} placeholder="Observações da triagem..." value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} />
            </div>
          </div>
          <Button onClick={handleSaveTriage} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
            <CheckCircle2 className="h-4 w-4 mr-1" />Concluir Triagem
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
