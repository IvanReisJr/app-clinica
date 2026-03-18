import { useState, useEffect } from "react";
import { Save, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface Schedule {
  id?: string;
  professional: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  active: boolean;
}

interface Professional {
  id: number;
  name: string;
}

export default function ScheduleConfig({ onClose }: { onClose: () => void }) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProf, setSelectedProf] = useState<string>("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    apiClient.get("/professionals/").then((res) => {
      const data = res.data.results || res.data;
      setProfessionals(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedProf) return;
    apiClient.get(`/professional-schedules/?professional=${selectedProf}`).then((res) => {
      const data = res.data.results || res.data;
      if (data && data.length > 0) {
        setSchedules(data.map((d: any) => ({
          id: d.id,
          professional: d.professional,
          day_of_week: d.day_of_week,
          start_time: d.start_time.slice(0, 5),
          end_time: d.end_time.slice(0, 5),
          slot_duration_minutes: d.slot_duration_minutes,
          active: d.active,
        })));
      } else {
        setSchedules([1, 2, 3, 4, 5].map(d => ({
          professional: parseInt(selectedProf),
          day_of_week: d,
          start_time: "08:00",
          end_time: "17:00",
          slot_duration_minutes: 30,
          active: true,
        })));
      }
    });
  }, [selectedProf]);

  const toggleDay = (day: number) => {
    const exists = schedules.find(s => s.day_of_week === day);
    if (exists) {
      setSchedules(schedules.map(s => s.day_of_week === day ? { ...s, active: !s.active } : s));
    } else {
      setSchedules([...schedules, {
        professional: parseInt(selectedProf),
        day_of_week: day,
        start_time: "08:00",
        end_time: "17:00",
        slot_duration_minutes: 30,
        active: true,
      }].sort((a, b) => a.day_of_week - b.day_of_week));
    }
  };

  const updateSchedule = (day: number, field: string, value: any) => {
    setSchedules(schedules.map(s => s.day_of_week === day ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    if (!selectedProf) return;
    setSaving(true);
    
    try {
      // Get existing ones to delete
      const res = await apiClient.get(`/professional-schedules/?professional=${selectedProf}`);
      const existing = res.data.results || res.data;
      
      // Delete existing sequential
      for (const e of existing) {
        await apiClient.delete(`/professional-schedules/${e.id}/`);
      }

      // Insert new sequential
      for (const s of schedules) {
        await apiClient.post(`/professional-schedules/`, {
          professional: s.professional,
          day_of_week: s.day_of_week,
          start_time: s.start_time + ":00",
          end_time: s.end_time + ":00",
          slot_duration_minutes: s.slot_duration_minutes,
          active: s.active,
        });
      }

      toast({ title: "Grade salva com sucesso" });
      onClose();
    } catch (e) {
      toast({ title: "Erro ao salvar grade", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Profissional</Label>
        <Select value={selectedProf} onValueChange={setSelectedProf}>
          <SelectTrigger><SelectValue placeholder="Selecione o profissional..." /></SelectTrigger>
          <SelectContent>
            {professionals.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedProf && (
        <>
          <div className="space-y-2">
            {[0, 1, 2, 3, 4, 5, 6].map(day => {
              const sched = schedules.find(s => s.day_of_week === day);
              const isActive = sched?.active ?? false;
              return (
                <div key={day} className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border transition-colors ${isActive ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-muted'}`}>
                  <div className="flex items-center gap-3">
                    <Switch checked={isActive} onCheckedChange={() => toggleDay(day)} />
                    <span className={`w-20 text-sm font-medium ${isActive ? '' : 'text-muted-foreground'}`}>{DAY_LABELS[day]}</span>
                  </div>
                  {isActive && sched && (
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      <Input type="time" value={sched.start_time} onChange={e => updateSchedule(day, "start_time", e.target.value)} className="w-28 h-8 text-sm" />
                      <span className="text-muted-foreground text-xs">até</span>
                      <Input type="time" value={sched.end_time} onChange={e => updateSchedule(day, "end_time", e.target.value)} className="w-28 h-8 text-sm" />
                      <Select value={String(sched.slot_duration_minutes)} onValueChange={v => updateSchedule(day, "slot_duration_minutes", parseInt(v))}>
                        <SelectTrigger className="w-24 h-8 text-xs bg-white dark:bg-slate-950">
                          <Clock className="h-3 w-3 mr-1" /><SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 min</SelectItem>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="20">20 min</SelectItem>
                          <SelectItem value="25">25 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="40">40 min</SelectItem>
                          <SelectItem value="60">60 min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />{saving ? "Salvando..." : "Salvar Grade"}
          </Button>
        </>
      )}
    </div>
  );
}
