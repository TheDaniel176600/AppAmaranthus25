
export enum UserRole {
  OWNER = 'OWNER',         // Super Admin do SaaS
  SINDICO = 'SINDICO',     // Admin do Condomínio (Acesso Total)
  SUBSINDICO = 'SUBSINDICO', // Admin Adjunto (Acesso Total)
  ZELADOR = 'ZELADOR',     // Operacional (Tarefas/Limpeza)
  MORADOR = 'MORADOR',     // Usuário Final (Reservas/Meus Dados)
  PRESTADOR = 'PRESTADOR'  // Externo (Manutenção Específica)
}

export enum ModuleType {
  DASHBOARD = 'Dashboard',
  USERS = 'Gestão de Usuários',
  RESIDENTS = 'Moradores',
  RESERVATIONS = 'Agendamentos',
  CLEANING = 'Limpeza',
  SAUNA = 'Sauna',
  FINANCIAL = 'Contas',
  REMINDERS = 'Lembretes',
  OVERTIME = 'Horas Extras',
  PURCHASES = 'Compras',
  VOUCHERS = 'Vales',
  OCCURRENCES = 'Ocorrências',
  PROVIDERS = 'Prestadores',
  KEYWORDS = 'Palavras-chave',
  CONFRATERNIZATION = 'Confraternizações',
  TASKS = 'Tarefas',
  MAINTENANCE = 'Manutenção',
  ACCESS_CONTROL = 'Gestão de Acessos'
}

export type ActionType = 'view' | 'create' | 'edit' | 'delete';

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type RolePermissions = {
  [key in ModuleType]?: ModulePermission;
};

export interface Resident {
  id: string; 
  condominioId: string;
  condominioNome: string;
  nome: string;
  apto: string;
  telefone: string;
  garagem?: 'G1' | 'G2' | '';
  vaga?: string;
  placa?: string;
  foto?: string; // Base64 ou URL
  observacoes?: string;
  criadoEm: string;
  criadoPor: string;
  ativo?: boolean;
}

export type SpaceType = 'churrasqueira' | 'social' | 'quiosque' | 'sauna_seca' | 'sauna_umida';

export interface Reservation {
  id: string;
  condominioId: string;
  criadoEm: string;
  criadoPor: string;
  data: string; // YYYY-MM-DD
  espaco: SpaceType;
  horaInicio: string;
  horaFim: string;
  observacoes: string;
  responsavel: string;
  status: 'liberado' | 'concluido' | 'cancelado';
  unidade: string;
}

export interface CleaningTask {
  id: string;
  condominioId: string;
  espaco: SpaceType;
  dataOriginalReserva: string;
  dataLimpeza: string;
  status: 'pendente' | 'realizada';
  responsavelReserva: string;
  unidadeReserva: string;
  responsavelLimpeza: string;
  horaInicio: string;
  horaFim: string;
  observacoes: string;
  finalizadoEm?: string;
  finalizadoPor?: string;
}

export type SaunaType = 'Seca' | 'Úmida';

export interface SaunaSession {
  id: string;
  condominioId: string;
  saunaType: SaunaType;
  residentName: string;
  unit: string;
  startTime: string;
  status: 'Ativa' | 'Concluída';
  endTime?: string;
  criadoEm?: any;
}

export interface Confraternization {
  id: string;
  morador: string;
  apto: string;
  adultos: number;
  criancas7a12: number;
  criancasMenor6: number;
  total: number;
  status: 'pago' | 'pendente';
}

export interface TaskHistory {
  concluidoPor: string;
  concluidoPorNome: string;
  dataConclusao: string;
  dataBase: string; // YYYY-MM-DD para controle de repetição
  tempoExecucao?: string;
}

export interface Task {
  id: string;
  condominioId: string;
  titulo: string;
  descricao: string;
  tipo: 'recorrente' | 'unica';
  turno: 'diurno' | 'noturno';
  diasSemana?: number[]; // 0-6 (Dom-Sab)
  dataUnica?: string;
  ativo: boolean;
  historicoConclusao: TaskHistory[];
  criadoEm: string;
}

export type OccurrenceStatus = 'aberto' | 'em_andamento' | 'resolvido' | 'cancelado';
export type OccurrencePriority = 'baixa' | 'media' | 'alta';
export type OccurrenceCategory = 'barulho' | 'manutencao' | 'limpeza' | 'seguranca' | 'outros';

export interface OccurrenceUpdate {
  usuarioId: string;
  usuarioNome: string;
  texto: string;
  data: string;
  statusAnterior?: OccurrenceStatus;
  statusNovo?: OccurrenceStatus;
  fotos?: string[]; // Suporte a fotos em atualizações
}

export interface Occurrence {
  id: string;
  condominioId: string;
  titulo: string;
  descricao: string;
  moradorId: string;
  moradorNome: string;
  unidade: string;
  status: OccurrenceStatus;
  prioridade: OccurrencePriority;
  categoria: OccurrenceCategory;
  fotos: string[]; // Fotos da abertura
  interacoes: OccurrenceUpdate[];
  criadoEm: string;
  finalizadoEm?: string;
  finalizadoPor?: string;
}
