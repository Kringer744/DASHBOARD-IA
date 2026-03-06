'use client'

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// =====================================================
// DADOS DE EXEMPLO (quando não há dados reais)
// =====================================================

const dadosExemplo = [
  { mes: 'Jan', conversas: 45, mensagens: 230, leads: 12 },
  { mes: 'Fev', conversas: 62, mensagens: 340, leads: 18 },
  { mes: 'Mar', conversas: 58, mensagens: 290, leads: 15 },
  { mes: 'Abr', conversas: 80, mensagens: 420, leads: 24 },
  { mes: 'Mai', conversas: 95, mensagens: 510, leads: 31 },
  { mes: 'Jun', conversas: 88, mensagens: 465, leads: 27 },
  { mes: 'Jul', conversas: 112, mensagens: 620, leads: 38 },
]

const canalDados = [
  { name: 'WhatsApp', value: 65 },
  { name: 'Web Chat', value: 20 },
  { name: 'E-mail', value: 10 },
  { name: 'Outros', value: 5 },
]

const CORES = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b']

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-elevated border border-bg-border rounded-lg p-3 shadow-card">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="text-sm font-medium" style={{ color: item.color }}>
          {item.name}: {item.value.toLocaleString('pt-BR')}
        </p>
      ))}
    </div>
  )
}

interface ConversasChartProps {
  dados?: typeof dadosExemplo
}

export function ConversasAreaChart({ dados }: ConversasChartProps) {
  const data = dados?.length ? dados : dadosExemplo
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorConversas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorMensagens" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
        <XAxis
          dataKey="mes"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={35}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="conversas"
          name="Conversas"
          stroke="#8b5cf6"
          strokeWidth={2}
          fill="url(#colorConversas)"
        />
        <Area
          type="monotone"
          dataKey="mensagens"
          name="Mensagens"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#colorMensagens)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function LeadsBarChart({ dados }: ConversasChartProps) {
  const data = dados?.length ? dados : dadosExemplo
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={10}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
        <XAxis
          dataKey="mes"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={35}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="leads" name="Leads" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CanalPieChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={canalDados}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={4}
          dataKey="value"
        >
          {canalDados.map((_, index) => (
            <Cell key={index} fill={CORES[index % CORES.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value}%`, '']}
          contentStyle={{
            backgroundColor: '#13131f',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#9ca3af' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
