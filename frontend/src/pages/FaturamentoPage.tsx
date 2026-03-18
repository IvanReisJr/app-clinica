import React, { useState, useMemo, useEffect } from 'react';
import { 
  DollarSign, Clock, Package, Send, CheckCircle, 
  XCircle, AlertTriangle, Eye, PlusSquare, Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Tipos Reais da API Django Faturamento
interface AtendimentoPendente {
  id: number;
  appointment_date: string;
  paciente_nome: string;
  carteirinha: string;
  profissional_nome: string;
  convenio_id: number;
  convenio_nome: string;
}

interface LoteItem {
  id: number;
  atendimento_id: number;
  data: string;
  paciente: string;
  profissional: string;
  status_conciliacao: "pendente" | "pago" | "glosa" | "recurso";
}

interface Lote {
  id: number;
  convenio: number;
  convenio_nome: string;
  itens: LoteItem[];
  status: "aberto" | "enviado";
  created_at: string;
  sent_at: string | null;
}

export function FaturamentoPage() {
  const [activeTab, setActiveTab] = useState<'pendentes' | 'lotes'>('pendentes');
  const [pendentes, setPendentes] = useState<AtendimentoPendente[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const { toast } = useToast();
  
  // Dialog de Conciliação
  const [conciliarLote, setConciliarLote] = useState<Lote | null>(null);

  // Fetch Real Data do Django
  const fetchData = async () => {
    try {
      const [resPend, resLotes] = await Promise.all([
        apiClient.get("/faturamento/lotes/pendentes/"),
        apiClient.get("/faturamento/lotes/")
      ]);
      setPendentes(resPend.data);
      setLotes(resLotes.data.results || resLotes.data);
    } catch (e) {
      console.error("Erro ao carregar faturamento:", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Derivados
  const agrupadoPorConvenio = useMemo(() => {
    const mapa = new Map<number, {nome: string, itens: AtendimentoPendente[]}>();
    pendentes.forEach(p => {
      if (!mapa.has(p.convenio_id)) mapa.set(p.convenio_id, { nome: p.convenio_nome, itens: [] });
      mapa.get(p.convenio_id)!.itens.push(p);
    });
    return Array.from(mapa.entries());
  }, [pendentes]);

  const handleCriarLote = async (convenio_id: number, itens: AtendimentoPendente[]) => {
    try {
      const pIds = itens.map(i => i.id);
      await apiClient.post("/faturamento/lotes/criar_lote/", {
        convenio_id,
        appointment_ids: pIds
      });
      toast({ title: "Lote criado", description: `${itens.length} guias empacotadas.` });
      fetchData();
      setActiveTab('lotes');
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao criar", description: "Verifique conexão." });
    }
  };

  const setItemConciliacao = async (loteId: number, itemId: number, novoStatus: LoteItem["status_conciliacao"]) => {
    try {
        await apiClient.patch(`/faturamento/itens-faturamento/${itemId}/conciliar/`, {
            status_conciliacao: novoStatus
        });
        
        // Atualiza Local UI rapido 
        setLotes(lotes.map(lote => {
          if (lote.id === loteId) {
            return {
              ...lote,
              itens: lote.itens.map(it => it.id === itemId ? { ...it, status_conciliacao: novoStatus } : it)
            };
          }
          return lote;
        }));
        
        if (conciliarLote && conciliarLote.id === loteId) {
          setConciliarLote({
            ...conciliarLote,
            itens: conciliarLote.itens.map(it => it.id === itemId ? { ...it, status_conciliacao: novoStatus } : it)
          });
        }
    } catch (e) {
        toast({ variant: "destructive", title: "Erro de Conciliação" });
    }
  };

  const handleMarcarEnviado = async (loteId: number) => {
    try {
        await apiClient.patch(`/faturamento/lotes/${loteId}/marcar_enviado/`);
        toast({ title: "Lote Fechado e Enviado" });
        fetchData();
        setConciliarLote(null);
    } catch (e) {
        toast({ variant: "destructive", title: "Erro.", description: "Verifique conexão." });
    }
  };

  // KPIs
  const atendimentosPendentes = pendentes.length;
  const lotesAbertos = lotes.filter(l => l.status === "aberto").length;
  const lotesEnviados = lotes.filter(l => l.status === "enviado").length;
  const totalLotes = lotes.length;

  return (
    <div className="space-y-6 animate-fade-in mb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="module-title flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" /> Faturamento de Lotes
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie lotes de faturamento por convênio e concilie pagamentos</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-blue-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl"><Clock className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold">{atendimentosPendentes}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase">Atend. Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-indigo-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-xl"><Package className="h-5 w-5 text-indigo-600" /></div>
            <div>
              <p className="text-2xl font-bold">{lotesAbertos}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase">Lotes Abertos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-emerald-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl"><Send className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-bold">{lotesEnviados}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase">Lotes Enviados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-amber-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-xl"><DollarSign className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-2xl font-bold">{totalLotes}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase">Total de Lotes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Customizadas */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg w-max">
        <button 
          onClick={() => setActiveTab('pendentes')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'pendentes' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Clock className="h-4 w-4" /> Pendentes ({agrupadoPorConvenio.length})
        </button>
        <button 
          onClick={() => setActiveTab('lotes')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'lotes' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Package className="h-4 w-4" /> Lotes ({totalLotes})
        </button>
      </div>

      {/* CONTEÚDO: PENDENTES */}
      {activeTab === 'pendentes' && (
        <div className="space-y-4">
          {agrupadoPorConvenio.length === 0 && (
            <Card className="border-dashed shadow-none bg-slate-50">
              <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center">
                <CheckCircle className="h-8 w-8 mb-2 text-emerald-500/50" />
                <p>Nenhum atendimento pendente de faturamento.</p>
              </CardContent>
            </Card>
          )}

          {agrupadoPorConvenio.map(([cId, grp]) => (
            <Card key={cId} className="shadow-sm border-slate-200">
              <CardHeader className="py-3 bg-slate-50 border-b flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-bold text-slate-700">{grp.nome}</CardTitle>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">{grp.itens.length} atendimentos</Badge>
                </div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleCriarLote(cId, grp.itens)}>
                  <PlusSquare className="h-4 w-4 mr-2" /> Criar Lote
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-4 py-3 border-b">Nº Atend.</th>
                        <th className="px-4 py-3 border-b">Data</th>
                        <th className="px-4 py-3 border-b">Paciente</th>
                        <th className="px-4 py-3 border-b">Carteirinha</th>
                        <th className="px-4 py-3 border-b">Profissional</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-600">
                      {grp.itens.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2">#{item.id}</td>
                          <td className="px-4 py-2">{item.appointment_date}</td>
                          <td className="px-4 py-2 font-medium text-slate-900">{item.paciente_nome}</td>
                          <td className="px-4 py-2">{item.carteirinha}</td>
                          <td className="px-4 py-2">{item.profissional_nome}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CONTEÚDO: LOTES */}
      {activeTab === 'lotes' && (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-6 py-4 border-b">Convênio</th>
                    <th className="px-6 py-4 border-b">Itens</th>
                    <th className="px-6 py-4 border-b">Status</th>
                    <th className="px-6 py-4 border-b">Criado em</th>
                    <th className="px-6 py-4 border-b">Enviado em</th>
                    <th className="px-6 py-4 border-b">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-600">
                  {lotes.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum lote criado.</td></tr>
                  )}
                  {lotes.map(lote => (
                    <tr key={lote.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-medium text-slate-900">{lote.convenio_nome}</td>
                      <td className="px-6 py-3">{lote.itens.length}</td>
                      <td className="px-6 py-3">
                        <Badge variant="outline" className={lote.status === 'enviado' ? 'bg-blue-500 text-white border-none' : 'bg-slate-200 text-slate-700'}>
                          {lote.status === 'enviado' ? 'Enviado' : 'Aberto'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs">{new Date(lote.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3 font-mono text-xs">{lote.sent_at ? new Date(lote.sent_at).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-3">
                        <Button variant="outline" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary" onClick={() => setConciliarLote(lote)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL DE CONCILIAÇÃO */}
      {conciliarLote && (
        <Dialog open={!!conciliarLote} onOpenChange={() => setConciliarLote(null)}>
          <DialogContent className="max-w-4xl bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Receipt className="h-5 w-5 text-primary" /> Conciliação — {conciliarLote.convenio_nome}
              </DialogTitle>
              <DialogDescription className="flex gap-2 pt-2 pb-2">
                <Badge variant="outline" className="bg-slate-100 text-slate-700">{conciliarLote.itens.length} itens</Badge>
                <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-none">{conciliarLote.itens.filter(i => i.status_conciliacao === 'pago').length} pagos</Badge>
                <Badge variant="outline" className="bg-rose-100 text-rose-700 border-none">{conciliarLote.itens.filter(i => i.status_conciliacao === 'glosa').length} glosados</Badge>
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-none">{conciliarLote.itens.filter(i => i.status_conciliacao === 'recurso').length} em recurso</Badge>
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-x-auto border rounded-xl mt-2 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 border-b">Atend.</th>
                    <th className="px-4 py-3 border-b">Data</th>
                    <th className="px-4 py-3 border-b">Paciente</th>
                    <th className="px-4 py-3 border-b">Profissional</th>
                    <th className="px-4 py-3 border-b">Status do Prontuário</th>
                    <th className="px-4 py-3 border-b text-center">Conciliar Faturamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-600">
                  {conciliarLote.itens.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">#{item.atendimento_id}</td>
                      <td className="px-4 py-3">{item.data}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{item.paciente}</td>
                      <td className="px-4 py-3">{item.profissional}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 shadow-none font-normal">Pendente Sistêmico</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button 
                            variant="outline" size="sm" 
                            className={`h-7 px-2.5 text-xs transition-all ${item.status_conciliacao === 'pago' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold' : 'hover:bg-emerald-50 text-slate-500'}`}
                            onClick={() => setItemConciliacao(conciliarLote.id, item.id, 'pago')}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Pago
                          </Button>
                          <Button 
                            variant="outline" size="sm" 
                            className={`h-7 px-2.5 text-xs transition-all ${item.status_conciliacao === 'glosa' ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold' : 'hover:bg-rose-50 text-slate-500'}`}
                            onClick={() => setItemConciliacao(conciliarLote.id, item.id, 'glosa')}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Glosa
                          </Button>
                          <Button 
                            variant="outline" size="sm" 
                            className={`h-7 px-2.5 text-xs transition-all ${item.status_conciliacao === 'recurso' ? 'bg-amber-50 border-amber-500 text-amber-700 font-bold' : 'hover:bg-amber-50 text-slate-500'}`}
                            onClick={() => setItemConciliacao(conciliarLote.id, item.id, 'recurso')}
                          >
                            <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Recurso
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border mt-2">
              <span className="text-sm font-medium text-slate-600">Ações do Lote</span>
              <div className="flex gap-2">
                <Button variant="outline" disabled={conciliarLote.status === 'enviado'}>Desfazer Lote</Button>
                {conciliarLote.status === 'aberto' ? (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleMarcarEnviado(conciliarLote.id)}
                  >
                    <Send className="h-4 w-4 mr-2" /> Marcar Lote como Enviado
                  </Button>
                ) : (
                  <Button variant="secondary" className="hover:bg-slate-200" onClick={() => setConciliarLote(null)}>
                    Fechar Visualização
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
