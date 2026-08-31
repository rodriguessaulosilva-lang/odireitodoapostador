// Rótulos em PT-BR e cores para os enums do banco.

export const AREAS = ["familia", "civel", "criminal", "trabalhista", "previdenciario", "imobiliario"] as const;
export const FASES = ["inicial", "conhecimento", "recursal", "execucao_cumprimento", "extrajudicial", "arquivado"] as const;
export const MANDATOS = ["dativo", "privado_rd", "privado_pessoal"] as const;

export const label: Record<string, string> = {
  // mandato
  dativo: "Dativo",
  privado_rd: "Privado RD",
  privado_pessoal: "Privado Pessoal",
  // area
  familia: "Família",
  civel: "Cível",
  criminal: "Criminal",
  trabalhista: "Trabalhista",
  previdenciario: "Previdenciário",
  imobiliario: "Imobiliário",
  // fase
  inicial: "Inicial",
  conhecimento: "Conhecimento",
  recursal: "Recursal",
  execucao_cumprimento: "Execução / Cumprimento",
  extrajudicial: "Extrajudicial",
  arquivado: "Arquivado",
  // publicacao
  intimacao: "Intimação",
  despacho: "Despacho",
  sentenca: "Sentença",
  acordao: "Acórdão",
  pauta: "Pauta",
  // prazo/status
  pendente: "Pendente",
  cumprido: "Cumprido",
  perdido: "Perdido",
  // audiencia
  instrucao: "Instrução",
  conciliacao: "Conciliação",
  julgamento: "Julgamento",
  presencial: "Presencial",
  virtual: "Virtual",
  agendada: "Agendada",
  realizada: "Realizada",
  adiada: "Adiada",
  cancelada: "Cancelada",
  // funil
  contato_inicial: "Contato inicial",
  consulta_agendada: "Consulta agendada",
  consulta_realizada: "Consulta realizada",
  proposta_enviada: "Proposta enviada",
  contratado: "Contratado",
  // origem
  indicacao: "Indicação",
  instagram: "Instagram",
  tiktok: "TikTok",
  google: "Google",
  outro: "Outro",
  // honorarios
  inicial_hon: "Iniciais",
  parcelado: "Parcelado",
  exito: "Êxito",
  dativo_rpv: "Dativo / RPV",
  pago: "Pago",
  aguardando: "Aguardando",
  recebido: "Recebido",
  sacado: "Sacado",
  // tarefa
  prazo_processual: "Prazo processual",
  elaborar_peca: "Elaborar peça",
  diligencia: "Diligência",
  contato_cliente: "Contato com cliente",
  audiencia: "Audiência",
  administrativo: "Administrativo",
  urgente: "Urgente",
  alta: "Alta",
  normal: "Normal",
  baixa: "Baixa",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  // conteudo
  video: "Vídeo",
  reels: "Reels",
  stories: "Stories",
  carrossel: "Carrossel",
  post_estatico: "Post estático",
  ideia: "Ideia",
  roteiro: "Roteiro",
  gravado: "Gravado",
  editado: "Editado",
  agendado: "Agendado",
  publicado: "Publicado",
  // escopo
  escritorio: "Escritório",
  pessoal: "Pessoal",
};

export function lbl(key: string | null | undefined): string {
  if (!key) return "—";
  return label[key] ?? key;
}

// Cores por tipo de mandato (badges)
export const mandatoBadge: Record<string, string> = {
  privado_rd: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  dativo: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  privado_pessoal: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20",
};

export const prioridadeBadge: Record<string, string> = {
  urgente: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
  alta: "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20",
  normal: "bg-slate-100 text-slate-600 ring-1 ring-slate-500/20",
  baixa: "bg-slate-50 text-slate-500 ring-1 ring-slate-400/20",
};
