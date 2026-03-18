import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Building2, DollarSign } from "lucide-react";
import tussData from "@/data/tuss.json";

interface Convenio {
  id: string;
  nome: string;
  registro_ans: string | null;
  tipo: string;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  observacoes: string | null;
  created_at: string;
}

interface ConvenioProcedimento {
  id: string;
  convenio_id: string;
  codigo_tuss: string;
  descricao: string;
  valor: number;
  ativo: boolean;
}

export default function ConveniosPage() {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [precosDialogOpen, setPrecosDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Convenio | null>(null);
  const [selectedConvenio, setSelectedConvenio] = useState<Convenio | null>(null);
  const [procedimentos, setProcedimentos] = useState<ConvenioProcedimento[]>([]);
  const [tussSearch, setTussSearch] = useState("");
  const [addProcDialogOpen, setAddProcDialogOpen] = useState(false);
  const [procValor, setProcValor] = useState("");
  const [selectedTuss, setSelectedTuss] = useState<{ codigo: string; descricao: string } | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    nome: "",
    registro_ans: "",
    tipo: "convenio",
    telefone: "",
    email: "",
    ativo: true,
    observacoes: "",
  });

  useEffect(() => {
    fetchConvenios();
  }, []);

  async function fetchConvenios() {
    setLoading(true);
    try {
      const response = await apiClient.get("convenios/lista/");
      setConvenios(response.data.results || response.data);
    } catch (error: any) {
      toast({ title: "Erro ao buscar convênios", description: error.response?.data?.detail || error.message, variant: "destructive" });
    }
    setLoading(false);
  }

  async function fetchProcedimentos(convenioId: string) {
    try {
      const response = await apiClient.get(`convenios/procedimentos/?convenio=${convenioId}`);
      setProcedimentos(response.data.results || response.data);
    } catch (error) {
      console.error("Erro ao carregar os procedimentos", error);
    }
  }

  function openNew() {
    setEditing(null);
    setForm({ nome: "", registro_ans: "", tipo: "convenio", telefone: "", email: "", ativo: true, observacoes: "" });
    setDialogOpen(true);
  }

  function openEdit(c: Convenio) {
    setEditing(c);
    setForm({
      nome: c.nome,
      registro_ans: c.registro_ans || "",
      tipo: c.tipo,
      telefone: c.telefone || "",
      email: c.email || "",
      ativo: c.ativo,
      observacoes: c.observacoes || "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast({ title: "Erro", description: "Nome do convênio é obrigatório.", variant: "destructive" });
      return;
    }

    const payload = {
      nome: form.nome.trim(),
      registro_ans: form.registro_ans.trim() || null,
      tipo: form.tipo,
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      ativo: form.ativo,
      observacoes: form.observacoes.trim() || null,
    };

    try {
      if (editing) {
        await apiClient.patch(`convenios/lista/${editing.id}/`, payload);
        toast({ title: "Convênio atualizado com sucesso" });
      } else {
        await apiClient.post("convenios/lista/", payload);
        toast({ title: "Convênio cadastrado com sucesso" });
      }
      setDialogOpen(false);
      fetchConvenios();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.response?.data?.detail || error.message, variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente excluir este convênio?")) return;
    try {
      await apiClient.delete(`convenios/lista/${id}/`);
      toast({ title: "Convênio excluído" });
      fetchConvenios();
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.response?.data?.detail || error.message, variant: "destructive" });
    }
  }

  function openPrecos(c: Convenio) {
    setSelectedConvenio(c);
    fetchProcedimentos(c.id);
    setPrecosDialogOpen(true);
  }

  async function handleAddProcedimento() {
    if (!selectedTuss || !selectedConvenio) return;
    const valor = parseFloat(procValor.replace(",", "."));
    if (isNaN(valor) || valor < 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }

    try {
      await apiClient.post("convenios/procedimentos/", {
        convenio: selectedConvenio.id,
        codigo_tuss: selectedTuss.codigo,
        descricao: selectedTuss.descricao,
        valor,
      });

      toast({ title: "Procedimento adicionado" });
      setAddProcDialogOpen(false);
      setSelectedTuss(null);
      setProcValor("");
      fetchProcedimentos(selectedConvenio.id);
    } catch (error: any) {
      toast({ title: "Erro", description: error.response?.data?.detail || error.message, variant: "destructive" });
    }
  }

  async function handleDeleteProcedimento(id: string) {
    if (!selectedConvenio) return;
    try {
      await apiClient.delete(`convenios/procedimentos/${id}/`);
      fetchProcedimentos(selectedConvenio.id);
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.response?.data?.detail || error.message, variant: "destructive" });
    }
  }

  const filtered = convenios.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      (c.registro_ans && c.registro_ans.includes(search))
  );

  const filteredTuss = tussData.filter(
    (t) =>
      t.codigo.includes(tussSearch) ||
      t.descricao.toLowerCase().includes(tussSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Convênios</h1>
          <p className="text-sm text-muted-foreground">Gerencie convênios e tabelas de preços TUSS</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo Convênio
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou registro ANS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Carregando...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">Nenhum convênio cadastrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Registro ANS</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{c.registro_ans || "—"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {c.telefone && <div>{c.telefone}</div>}
                        {c.email && <div className="text-muted-foreground">{c.email}</div>}
                        {!c.telefone && !c.email && "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.ativo ? "default" : "secondary"}>
                        {c.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => openPrecos(c)} title="Tabela de Preços">
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Cadastro/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Convênio" : "Novo Convênio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <Label>Registro ANS</Label>
              <Input value={form.registro_ans} onChange={(e) => setForm({ ...form, registro_ans: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
              <Label>Ativo</Label>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Tabela de Preços */}
      <Dialog open={precosDialogOpen} onOpenChange={setPrecosDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Tabela de Preços — {selectedConvenio?.nome}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4">
            <Button size="sm" onClick={() => { setAddProcDialogOpen(true); setTussSearch(""); setSelectedTuss(null); setProcValor(""); }}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Procedimento
            </Button>
            {procedimentos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum procedimento cadastrado para este convênio.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código TUSS</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor (R$)</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procedimentos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.codigo_tuss}</TableCell>
                      <TableCell>{p.descricao}</TableCell>
                      <TableCell className="text-right">{Number(p.valor).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleDeleteProcedimento(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Procedimento TUSS */}
      <Dialog open={addProcDialogOpen} onOpenChange={setAddProcDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Procedimento TUSS</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Buscar procedimento</Label>
              <Input
                placeholder="Código ou descrição..."
                value={tussSearch}
                onChange={(e) => setTussSearch(e.target.value)}
              />
            </div>
            {tussSearch && (
              <div className="max-h-48 overflow-y-auto border rounded-md">
                {filteredTuss.slice(0, 20).map((t) => (
                  <button
                    key={t.codigo}
                    onClick={() => { setSelectedTuss(t); setTussSearch(""); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors border-b last:border-b-0 ${
                      selectedTuss?.codigo === t.codigo ? "bg-accent" : ""
                    }`}
                  >
                    <span className="font-mono text-xs text-muted-foreground">{t.codigo}</span>{" "}
                    {t.descricao}
                  </button>
                ))}
              </div>
            )}
            {selectedTuss && (
              <div className="p-3 rounded-md bg-muted text-sm">
                <strong>{selectedTuss.codigo}</strong> — {selectedTuss.descricao}
              </div>
            )}
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="text"
                placeholder="0,00"
                value={procValor}
                onChange={(e) => setProcValor(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProcDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddProcedimento} disabled={!selectedTuss}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
