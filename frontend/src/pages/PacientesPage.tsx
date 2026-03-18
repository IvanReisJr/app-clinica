import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Search, Eye, Trash2, Camera, User, ShieldAlert, AlertTriangle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

interface Patient {
  id: string;
  name: string;
  cpf: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  insurance: string | null;
  notes: string | null;
  sex: string | null;
  emergency_contact: string | null;
  medical_record_number: number | null;
  photo_url: string | null;
  convenio_id: string | null;
  numero_carteirinha: string | null;
  validade_plano: string | null;
  tipo_plano: string | null;
}

interface Convenio {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
}

const emptyForm = {
  name: "", cpf: "", birth_date: "", phone: "", email: "", address: "",
  insurance: "", notes: "", sex: "", emergency_contact: "",
  convenio_id: "", numero_carteirinha: "", validade_plano: "", tipo_plano: "",
};

export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [viewPatient, setViewPatient] = useState<Patient | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchPatients = async () => {
    try {
      const response = await apiClient.get("/patients/");
      const data = response.data.results || response.data;
      const mapped = data.map((p: any) => ({
        ...p,
        name: p.full_name || p.name || "",
        sex: p.gender || p.sex || "",
        birth_date: p.date_of_birth || p.birth_date || "",
        photo_url: p.photo || p.photo_url || null,
        convenio_id: p.convenio_id || null,
        numero_carteirinha: p.numero_carteirinha || "",
        validade_plano: p.validade_plano || "",
        tipo_plano: p.tipo_plano || ""
      }));
      setPatients(mapped);
    } catch (e) {
      console.error("Erro ao carregar pacientes", e);
    }
  };

  const fetchConvenios = async () => {
    try {
      const response = await apiClient.get("/convenios/lista/?ativo=true");
      setConvenios(response.data.results || response.data);
    } catch (e) {
      console.error("Erro ao carregar convenios", e);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchConvenios();
  }, []);

  const selectedConvenio = useMemo(() => {
    if (!form.convenio_id || form.convenio_id === "particular") return null;
    return convenios.find(c => c.id === form.convenio_id) || null;
  }, [form.convenio_id, convenios]);

  const isConvenio = !!selectedConvenio;

  const carteirinhaVencida = useMemo(() => {
    if (!form.validade_plano) return false;
    return new Date(form.validade_plano) < new Date();
  }, [form.validade_plano]);

  const convenioFieldsMissing = useMemo(() => {
    if (!isConvenio) return [];
    const missing: string[] = [];
    if (!form.numero_carteirinha?.trim()) missing.push("Número da Carteirinha");
    if (!form.validade_plano) missing.push("Validade do Plano");
    if (!form.tipo_plano) missing.push("Tipo do Plano");
    return missing;
  }, [isConvenio, form.numero_carteirinha, form.validade_plano, form.tipo_plano]);

  const canSave = form.name.trim() && form.convenio_id !== "" && (!isConvenio || convenioFieldsMissing.length === 0) && !carteirinhaVencida;

  const filtered = patients.filter((p) => {
    const nome = p.name || "";
    const cpfStr = p.cpf || "";
    const cartStr = p.numero_carteirinha || "";
    return nome.toLowerCase().includes(search.toLowerCase()) ||
      cpfStr.includes(search) ||
      cartStr.includes(search);
  });

  const getConvenioName = (convenioId: string | null) => {
    if (!convenioId) return "Particular";
    return convenios.find(c => c.id === convenioId)?.nome || "—";
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async (patientId: string): Promise<string | null> => {
    if (!photoFile) return null;
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);

      const response = await apiClient.patch(`/patients/${patientId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.photo || null;
    } catch (e) {
      console.error("Erro ao salvar foto", e);
      toast({ title: "Aviso da Câmera", description: "O paciente foi salvo, mas não conseguimos anexar a foto ao banco.", variant: "destructive" });
      return null;
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setUploading(true);

    const convenioId = form.convenio_id && form.convenio_id !== "particular" ? form.convenio_id : null;

    const payload: any = {
      full_name: form.name.trim(),
      cpf: form.cpf || null,
      date_of_birth: form.birth_date || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      insurance: convenioId ? getConvenioName(convenioId) : "Particular",
      notes: form.notes || null,
      gender: form.sex || null,
      emergency_contact: form.emergency_contact || null,
      convenio_id: convenioId,
      numero_carteirinha: convenioId ? form.numero_carteirinha || null : null,
      validade_plano: convenioId ? form.validade_plano || null : null,
      tipo_plano: convenioId ? form.tipo_plano || null : null,
    };

    try {
      let patientId = editing;
      if (editing) {
        await apiClient.patch(`/patients/${editing}/`, payload);
      } else {
        const response = await apiClient.post("/patients/", payload);
        patientId = response.data.id;
      }

      if (patientId && photoFile) {
        const url = await uploadPhoto(patientId);
        // Opcional: Atualizar URL da foto quando endpoint existir
      }

      resetForm();
      fetchPatients();
      toast({ title: editing ? "Paciente atualizado" : "Paciente cadastrado" });
    } catch (error: any) {
      toast({ title: "Erro ao salvar paciente", description: error.response?.data?.detail || error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setOpen(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este paciente?")) return;
    try {
      await apiClient.delete(`/patients/${id}/`);
      fetchPatients();
      toast({ title: "Paciente excluído" });
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.response?.data?.detail || "Este paciente pode estar vinculado a consultas.", variant: "destructive" });
    }
  };

  const handleEdit = (p: Patient) => {
    setForm({
      name: p.name,
      cpf: p.cpf || "",
      birth_date: p.birth_date || "",
      phone: p.phone || "",
      email: p.email || "",
      address: p.address || "",
      insurance: p.insurance || "",
      notes: p.notes || "",
      sex: p.sex || "",
      emergency_contact: p.emergency_contact || "",
      convenio_id: p.convenio_id || "particular",
      numero_carteirinha: p.numero_carteirinha || "",
      validade_plano: p.validade_plano || "",
      tipo_plano: p.tipo_plano || "",
    });
    setPhotoPreview(p.photo_url || null);
    setPhotoFile(null);
    setEditing(p.id);
    setOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="module-header flex-wrap gap-2">
        <h1 className="module-title">Pacientes</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Paciente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} Paciente</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              {/* Photo */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="relative w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground/40" />
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 py-1 text-center">
                    <Camera className="h-3 w-3 mx-auto text-white" />
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                <span className="text-xs text-muted-foreground">Clique para adicionar foto</span>
              </div>

              {/* Dados Pessoais */}
              <div className="space-y-1"><Label>Nome Completo *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
                <div className="space-y-1"><Label>Data de Nascimento</Label><Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Sexo</Label>
                  <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1"><Label>Endereço</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="space-y-1"><Label>Contato Emergência</Label><Input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} /></div>

              {/* ===== SEÇÃO CONVÊNIO ===== */}
              <Card className={`border-2 ${isConvenio ? 'border-primary/50 bg-primary/5' : 'border-muted'}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Plano de Saúde / Convênio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-1">
                      Convênio *
                      {!form.convenio_id && <span className="text-destructive text-xs">(obrigatório)</span>}
                    </Label>
                    <Select
                      value={form.convenio_id || undefined}
                      onValueChange={(v) => setForm({
                        ...form,
                        convenio_id: v,
                        // Reset convenio fields when switching to particular
                        ...(v === "particular" ? { numero_carteirinha: "", validade_plano: "", tipo_plano: "" } : {}),
                      })}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione o convênio" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="particular">Particular (sem convênio)</SelectItem>
                        {convenios.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {isConvenio && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      {/* Alerta de campos pendentes */}
                      {convenioFieldsMissing.length > 0 && (
                        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                          <ShieldAlert className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            <strong>Dados obrigatórios para o convênio {selectedConvenio?.nome} estão pendentes para evitar glosa:</strong>{" "}
                            {convenioFieldsMissing.join(", ")}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="flex items-center gap-1">
                            Nº Carteirinha *
                            {!form.numero_carteirinha?.trim() && <span className="text-destructive text-xs">(obrigatório)</span>}
                          </Label>
                          <Input
                            value={form.numero_carteirinha}
                            onChange={(e) => {
                              // Allow only numbers and hyphens
                              const val = e.target.value.replace(/[^0-9\-]/g, "");
                              setForm({ ...form, numero_carteirinha: val });
                            }}
                            placeholder="0000000000000"
                            className={!form.numero_carteirinha?.trim() ? "border-destructive" : ""}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="flex items-center gap-1">
                            Validade do Plano *
                            {!form.validade_plano && <span className="text-destructive text-xs">(obrigatório)</span>}
                          </Label>
                          <Input
                            type="date"
                            value={form.validade_plano}
                            onChange={(e) => setForm({ ...form, validade_plano: e.target.value })}
                            className={!form.validade_plano || carteirinhaVencida ? "border-destructive" : ""}
                          />
                          {carteirinhaVencida && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Carteirinha vencida! Solicite renovação ao paciente.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="flex items-center gap-1">
                          Tipo do Plano / Acomodação *
                          {!form.tipo_plano && <span className="text-destructive text-xs">(obrigatório)</span>}
                        </Label>
                        <Select value={form.tipo_plano} onValueChange={(v) => setForm({ ...form, tipo_plano: v })}>
                          <SelectTrigger className={!form.tipo_plano ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecione o tipo do plano" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basico">Básico</SelectItem>
                            <SelectItem value="especial">Especial</SelectItem>
                            <SelectItem value="executivo">Executivo</SelectItem>
                            <SelectItem value="enfermaria">Enfermaria</SelectItem>
                            <SelectItem value="apartamento">Apartamento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-1"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            </div>

            {/* Save button with validation */}
            <div className="space-y-2">
              {!form.convenio_id && (
                <p className="text-xs text-destructive text-center font-medium">
                  Selecione o convênio ou marque "Particular" para o paciente
                </p>
              )}
              {isConvenio && convenioFieldsMissing.length > 0 && (
                <p className="text-xs text-destructive text-center font-medium">
                  Preencha todos os campos obrigatórios do convênio para salvar
                </p>
              )}
              {carteirinhaVencida && (
                <p className="text-xs text-destructive text-center font-medium">
                  Não é possível salvar com carteirinha vencida
                </p>
              )}
              <Button onClick={handleSave} disabled={uploading || !canSave} className="w-full">
                {uploading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, CPF ou carteirinha..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="table-container overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold w-12"></th>
              <th className="px-4 py-3 text-left font-semibold">Prontuário</th>
              <th className="px-4 py-3 text-left font-semibold">Nome</th>
              <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">CPF</th>
              <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Telefone</th>
              <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Convênio</th>
              <th className="px-4 py-3 text-left font-semibold hidden xl:table-cell">Carteirinha</th>
              <th className="px-4 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Avatar className="h-8 w-8">
                    {p.photo_url && <AvatarImage src={p.photo_url} alt={p.name} />}
                    <AvatarFallback className="text-xs">{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{String(p.medical_record_number || 0).padStart(6, "0")}</td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{p.cpf || "—"}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{p.phone || "—"}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <Badge variant={p.convenio_id ? "default" : "secondary"} className="text-xs">
                    {getConvenioName(p.convenio_id)}
                  </Badge>
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground font-mono text-xs">{p.numero_carteirinha || "—"}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => setViewPatient(p)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>Editar</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nenhum paciente encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewPatient} onOpenChange={() => setViewPatient(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{viewPatient?.name}</DialogTitle></DialogHeader>
          {viewPatient && (
            <div className="space-y-3 text-sm py-2">
              <div className="flex justify-center mb-4">
                <Avatar className="h-20 w-20">
                  {viewPatient.photo_url && <AvatarImage src={viewPatient.photo_url} alt={viewPatient.name} />}
                  <AvatarFallback className="text-xl">{viewPatient.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground text-xs block">Prontuário</span>#{String(viewPatient.medical_record_number || 0).padStart(6, "0")}</div>
                <div><span className="text-muted-foreground text-xs block">CPF</span>{viewPatient.cpf || "—"}</div>
                <div><span className="text-muted-foreground text-xs block">Nascimento</span>{viewPatient.birth_date || "—"}</div>
                <div><span className="text-muted-foreground text-xs block">Sexo</span>{viewPatient.sex || "—"}</div>
                <div><span className="text-muted-foreground text-xs block">Telefone</span>{viewPatient.phone || "—"}</div>
                <div><span className="text-muted-foreground text-xs block">E-mail</span>{viewPatient.email || "—"}</div>
                <div className="col-span-2"><span className="text-muted-foreground text-xs block">Endereço</span>{viewPatient.address || "—"}</div>
              </div>

              {viewPatient.convenio_id && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="pt-4 space-y-2">
                    <p className="font-medium text-sm flex items-center gap-1"><CreditCard className="h-3.5 w-3.5" /> Dados do Convênio</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><span className="text-muted-foreground text-xs block">Convênio</span>{getConvenioName(viewPatient.convenio_id)}</div>
                      <div><span className="text-muted-foreground text-xs block">Carteirinha</span>{viewPatient.numero_carteirinha || "—"}</div>
                      <div><span className="text-muted-foreground text-xs block">Validade</span>{viewPatient.validade_plano || "—"}</div>
                      <div><span className="text-muted-foreground text-xs block">Tipo do Plano</span>{viewPatient.tipo_plano || "—"}</div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {!viewPatient.convenio_id && (
                <div><span className="text-muted-foreground text-xs block">Convênio</span><Badge variant="secondary">Particular</Badge></div>
              )}

              <div><span className="text-muted-foreground text-xs block">Contato Emergência</span>{viewPatient.emergency_contact || "—"}</div>
              <div><span className="text-muted-foreground text-xs block">Obs</span>{viewPatient.notes || "—"}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
