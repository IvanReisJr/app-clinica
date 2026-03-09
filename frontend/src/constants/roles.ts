export const roleLabels: Record<string, string> = {
    admin: "Administrador",
    receptionist: "Recepção",
    doctor: "Médico",
    enfermagem: "Enfermagem",
    farmacia: "Farmácia",
    financeiro: "Financeiro",
    painel: "Painel",
};

export const roleColors: Record<string, string> = {
    admin: "bg-blue-100 text-blue-700 border-blue-200",
    receptionist: "bg-emerald-100 text-emerald-700 border-emerald-200",
    doctor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    enfermagem: "bg-amber-100 text-amber-700 border-amber-200",
    farmacia: "bg-purple-100 text-purple-700 border-purple-200",
    financeiro: "bg-slate-100 text-slate-700 border-slate-200",
    painel: "bg-rose-100 text-rose-700 border-rose-200",
};

export const roleOptions = Object.entries(roleLabels).map(([value, label]) => ({
    value,
    label,
}));
