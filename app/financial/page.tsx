'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DollarSign, TrendingUp, Scissors, Receipt } from 'lucide-react';
import Header from '@/components/header';
import BottomNav from '@/components/bottom-nav';
import StatsCard from '@/components/stats-card';
import Loading from '@/components/loading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';

interface MonthlyReport {
  month: string;
  totalAppointments: number;
  grossRevenue: number;
  monthlyFixedCost: number;
  netProfit: number;
  averageTicket: number;
  dailyRevenue: { [key: string]: number };
}

export default function FinancialPage() {
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (status === 'authenticated') {
      loadReport(selectedMonth);
    }
  }, [status, selectedMonth]);

  const loadReport = async (month: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?month=${month}`);
      if (res?.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <Loading />
        <BottomNav />
      </div>
    );
  }

  const maxDailyRevenue = report?.dailyRevenue
    ? Math.max(...Object.values(report.dailyRevenue))
    : 0;

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header />

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Financeiro</h1>
            <p className="text-gray-400 text-sm">Relatório mensal de faturamento</p>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400">Mês/Ano</Label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e?.target?.value || '')}
              className="bg-zinc-900 border-gold/20 text-white"
            />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Atendimentos"
            value={report?.totalAppointments || 0}
            icon={Scissors}
          />
          <StatsCard
            title="Faturamento Bruto"
            value={formatCurrency(report?.grossRevenue || 0)}
            icon={DollarSign}
          />
          <StatsCard
            title="Ticket Médio"
            value={formatCurrency(report?.averageTicket || 0)}
            icon={Receipt}
            iconColor="text-blue-500"
          />
          <StatsCard
            title="Lucro Líquido"
            value={formatCurrency(report?.netProfit || 0)}
            icon={TrendingUp}
            iconColor={report && report?.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}
          />
        </div>

        {/* Cost breakdown */}
        <Card className="bg-zinc-900 border-gold/20">
          <CardHeader>
            <CardTitle className="text-white">Resumo de Custos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-zinc-800 rounded-lg">
                <span className="text-gray-400">Faturamento Bruto</span>
                <span className="text-lg font-semibold text-green-500">
                  {formatCurrency(report?.grossRevenue || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-zinc-800 rounded-lg">
                <span className="text-gray-400">Custo Fixo Mensal</span>
                <span className="text-lg font-semibold text-orange-500">
                  - {formatCurrency(report?.monthlyFixedCost || 0)}
                </span>
              </div>
              <div className="h-px bg-gold/20" />
              <div className="flex justify-between items-center p-3 bg-gold/10 rounded-lg border border-gold/20">
                <span className="text-white font-semibold">Lucro Líquido</span>
                <span
                  className={`text-xl font-bold ${
                    report && report?.netProfit >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {formatCurrency(report?.netProfit || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily revenue chart */}
        {report?.dailyRevenue && Object.keys(report?.dailyRevenue || {})?.length > 0 && (
          <Card className="bg-zinc-900 border-gold/20">
            <CardHeader>
              <CardTitle className="text-white">Faturamento Diário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(report?.dailyRevenue || {})
                  ?.sort(([a], [b]) => parseInt(a) - parseInt(b))
                  ?.map(([day, revenue]) => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-8">Dia {day}</span>
                      <div className="flex-1 bg-zinc-800 rounded-full h-8 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-gold to-yellow-500 h-full flex items-center justify-end px-3 transition-all duration-300"
                          style={{
                            width: `${maxDailyRevenue > 0 ? (revenue / maxDailyRevenue) * 100 : 0}%`,
                            minWidth: revenue > 0 ? '60px' : '0'
                          }}
                        >
                          <span className="text-xs font-semibold text-black">
                            {formatCurrency(revenue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
