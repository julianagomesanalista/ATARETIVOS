import { User, Task, ChatMessage } from '@/types';
import { calculateDueDate } from '@/utils/sla';

// ─── Mock Users ───────────────────────────────────────────────────────────────
export const mockUsers: User[] = [
  {
    id: 'user-1',
    google_id: 'google-admin-001',
    email: 'felipe@ativos.com.br',
    full_name: 'Felipe Silva',
    avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felipe&backgroundColor=b6e3f4',
    role: 'admin',
    area: 'Tecnologia',
    created_at: '2024-01-10T08:00:00Z',
  },
  {
    id: 'user-2',
    google_id: 'google-master-002',
    email: 'maria@ativos.com.br',
    full_name: 'Maria Santos',
    avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Maria&backgroundColor=ffd5dc',
    role: 'master',
    area: 'Marketing',
    created_at: '2024-01-12T09:00:00Z',
  },
  {
    id: 'user-3',
    google_id: 'google-user-003',
    email: 'joao@ativos.com.br',
    full_name: 'João Oliveira',
    avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Joao&backgroundColor=c0aede',
    role: 'user',
    area: 'Comercial',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'user-4',
    google_id: 'google-user-004',
    email: 'ana@ativos.com.br',
    full_name: 'Ana Costa',
    avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ana&backgroundColor=d1f0c2',
    role: 'user',
    area: 'Jurídico',
    created_at: '2024-01-18T11:00:00Z',
  },
];

// Helper to find user
export const findUser = (id: string) => mockUsers.find((u) => u.id === id);

// ─── Dates for demo ───────────────────────────────────────────────────────────
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
const daysFromNow = (n: number) => new Date(now.getTime() + n * 86400000).toISOString();
const dueFromCreated = (created: string, complexity: 'facil' | 'medio' | 'dificil') =>
  calculateDueDate(created, complexity).toISOString();

// ─── Mock Tasks ───────────────────────────────────────────────────────────────
export const mockTasks: Task[] = [
  // ── A FAZER ──────────────────────────────────────────────────────────
  {
    id: 'task-1',
    title: 'Criar campanha de Dia dos Pais para redes sociais',
    description: 'Desenvolver 5 posts + stories + reels para Instagram e Facebook.',
    status: 'todo',
    complexity: 'medio',
    creator_id: 'user-1',
    creator: findUser('user-1'),
    assigned_to: 'user-3',
    assignee: findUser('user-3'),
    company_name: 'ATIVOS DIGITAL',
    created_at: daysAgo(1),
    due_date: dueFromCreated(daysAgo(1), 'medio'),
    tags: [
      { name: 'Mídia', color: 'bg-purple-500' },
      { name: 'Social', color: 'bg-blue-500' },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: 'task-2',
    title: 'Proposta comercial para cliente Construtech',
    description: 'Montar apresentação com portfólio e precificação dos serviços.',
    status: 'todo',
    complexity: 'facil',
    creator_id: 'user-2',
    creator: findUser('user-2'),
    assigned_to: 'user-2',
    assignee: findUser('user-2'),
    company_name: 'CONSTRUTECH SA',
    created_at: daysAgo(3),
    due_date: dueFromCreated(daysAgo(3), 'facil'), // overdued for demo
    tags: [
      { name: 'Proposta', color: 'bg-green-500' },
      { name: 'Urgente', color: 'bg-red-500' },
    ],
    comments: [
      {
        id: 'comment-1',
        task_id: 'task-2',
        user_id: 'user-1',
        user: findUser('user-1'),
        content: 'Felipe: incluir cases de sucesso com empresas do setor de construção.',
        is_edited: false,
        created_at: daysAgo(2),
      },
    ],
    attachments: [],
  },
  {
    id: 'task-3',
    title: 'Redesign do site institucional com nova identidade visual',
    description: 'Wireframes, UI Kit e implementação frontend usando Figma + Next.js.',
    status: 'todo',
    complexity: 'dificil',
    creator_id: 'user-1',
    creator: findUser('user-1'),
    company_name: 'ATIVOS DIGITAL',
    created_at: daysAgo(2),
    due_date: dueFromCreated(daysAgo(2), 'dificil'),
    tags: [{ name: 'Design', color: 'bg-pink-500' }],
    comments: [],
    attachments: [],
  },
  // ── FAZENDO ──────────────────────────────────────────────────────────
  {
    id: 'task-4',
    title: 'Edição do vídeo institucional trimestral',
    description: 'Corte, color grading, inserção de motion graphics e narração.',
    status: 'doing',
    complexity: 'medio',
    creator_id: 'user-2',
    creator: findUser('user-2'),
    assigned_to: 'user-4',
    assignee: findUser('user-4'),
    company_name: 'PROJETO CANON',
    created_at: daysAgo(2),
    due_date: dueFromCreated(daysAgo(2), 'medio'),
    tags: [
      { name: 'Mídia', color: 'bg-purple-500' },
      { name: 'Vídeo', color: 'bg-indigo-500' },
    ],
    comments: [
      {
        id: 'comment-2',
        task_id: 'task-4',
        user_id: 'user-4',
        user: findUser('user-4'),
        content: 'Finalizei o corte bruto. Aguardando aprovação do roteiro antes de continuar.',
        is_edited: false,
        created_at: daysAgo(1),
      },
      {
        id: 'comment-3',
        task_id: 'task-4',
        user_id: 'user-2',
        user: findUser('user-2'),
        content: 'Roteiro aprovado. Pode continuar com o color grading.',
        is_edited: false,
        created_at: daysAgo(0),
      },
    ],
    attachments: [],
  },
  {
    id: 'task-5',
    title: 'Integração Google Analytics 4 no portal do cliente',
    description: 'Configurar eventos customizados, metas e dashboard de conversão.',
    status: 'doing',
    complexity: 'facil',
    creator_id: 'user-3',
    creator: findUser('user-3'),
    company_name: 'PORTAL ATIVOS',
    created_at: daysAgo(1),
    due_date: daysFromNow(1),
    tags: [{ name: 'Dev', color: 'bg-cyan-500' }],
    comments: [],
    attachments: [],
  },
  // ── FEITO ────────────────────────────────────────────────────────────
  {
    id: 'task-6',
    title: 'Relatório de métricas — Campanha Q1 2025',
    description: 'Consolidar dados de alcance, engajamento e ROI das campanhas do primeiro trimestre.',
    status: 'done',
    complexity: 'facil',
    creator_id: 'user-1',
    creator: findUser('user-1'),
    company_name: 'ATIVOS DIGITAL',
    created_at: daysAgo(10),
    due_date: dueFromCreated(daysAgo(10), 'facil'),
    tags: [{ name: 'Relatório', color: 'bg-emerald-500' }],
    comments: [],
    attachments: [],
  },
  {
    id: 'task-7',
    title: 'Criação de identidade visual — Startup NovaPay',
    description: 'Logo, paleta, tipografia, manual da marca e aplicações.',
    status: 'done',
    complexity: 'dificil',
    creator_id: 'user-2',
    creator: findUser('user-2'),
    company_name: 'NOVAPAY',
    created_at: daysAgo(20),
    due_date: dueFromCreated(daysAgo(20), 'dificil'),
    tags: [
      { name: 'Design', color: 'bg-pink-500' },
      { name: 'Branding', color: 'bg-yellow-500' },
    ],
    comments: [],
    attachments: [],
  },
];

// ─── Mock Chat Messages ───────────────────────────────────────────────────────
export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender_id: 'user-1',
    sender: findUser('user-1'),
    message: 'Pessoal, a tarefa #task-2 está atrasada. Alguém pode dar uma olhada?',
    task_mention_id: 'task-2',
    created_at: daysAgo(1),
  },
  {
    id: 'msg-2',
    sender_id: 'user-2',
    sender: findUser('user-2'),
    message: 'Estou vendo agora, @João você pode ajudar com a task #task-4?',
    created_at: daysAgo(0),
  },
  {
    id: 'msg-3',
    sender_id: 'user-3',
    sender: findUser('user-3'),
    message: 'Sim! Já estou em cima disso. 🚀',
    created_at: new Date().toISOString(),
  },
];
