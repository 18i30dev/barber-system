'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import Header from '@/components/header';
import BottomNav from '@/components/bottom-nav';
import Loading from '@/components/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface SettingsData {
  barberShopName?: string;
  monthlyFixedCost: number;
  daysToConsiderInactive: number;
  reengagementMessage: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<SettingsData>({
    barberShopName: '',
    monthlyFixedCost: 0,
    daysToConsiderInactive: 30,
    reengagementMessage: ''
  });

  useEffect(() => {
    if (status === 'authenticated') {
      loadSettings();
    }
  }, [status]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res?.ok) {
        const data = await res.json();
        setFormData({
          barberShopName: data?.barberShopName || '',
          monthlyFixedCost: Number(data?.monthlyFixedCost) || 0,
          daysToConsiderInactive: data?.daysToConsiderInactive || 30,
          reengagementMessage: data?.reengagementMessage || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res?.ok) {
        toast({
          title: 'Sucesso!',
          description: 'Configurações salvas'
        });
      } else {
        const error = await res.json();
        toast({
          title: 'Erro',
          description: error?.error || 'Erro ao salvar',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
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

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header section */}
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-gray-400 text-sm">Personalize o sistema para sua barbearia</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General settings */}
          <Card className="bg-zinc-900 border-gold/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-gold" />
                Informações Gerais
              </CardTitle>
              <CardDescription className="text-gray-400">
                Dados básicos da sua barbearia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Nome da Barbearia</Label>
                <Input
                  placeholder="Minha Barbearia"
                  value={formData.barberShopName}
                  onChange={(e) =>
                    setFormData({ ...formData, barberShopName: e?.target?.value || '' })
                  }
                  className="bg-zinc-800 border-gold/20 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Custo Fixo Mensal (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monthlyFixedCost}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthlyFixedCost: parseFloat(e?.target?.value || '0')
                    })
                  }
                  className="bg-zinc-800 border-gold/20 text-white"
                />
                <p className="text-xs text-gray-500">
                  Usado para calcular o lucro líquido nos relatórios
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reengagement settings */}
          <Card className="bg-zinc-900 border-gold/20">
            <CardHeader>
              <CardTitle className="text-white">Configurações de Reengajamento</CardTitle>
              <CardDescription className="text-gray-400">
                Personalize como identificar e contatar clientes inativos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Dias para considerar cliente inativo</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.daysToConsiderInactive}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      daysToConsiderInactive: parseInt(e?.target?.value || '30')
                    })
                  }
                  className="bg-zinc-800 border-gold/20 text-white"
                />
                <p className="text-xs text-gray-500">
                  Clientes que não aparecem há mais de X dias serão considerados inativos
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Mensagem de Reengajamento</Label>
                <Textarea
                  placeholder="Digite sua mensagem..."
                  value={formData.reengagementMessage}
                  onChange={(e) =>
                    setFormData({ ...formData, reengagementMessage: e?.target?.value || '' })
                  }
                  className="bg-zinc-800 border-gold/20 text-white min-h-[120px]"
                  rows={5}
                />
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Você pode usar os seguintes placeholders:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>
                      <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-gold">
                        [NOME_CLIENTE]
                      </code>{' '}
                      - Nome do cliente
                    </li>
                    <li>
                      <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-gold">
                        [NOME_BARBEARIA]
                      </code>{' '}
                      - Nome da sua barbearia
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save button */}
          <Button
            type="submit"
            className="w-full bg-gold text-black hover:bg-gold/90 font-semibold"
            disabled={isSaving}
          >
            {isSaving ? (
              'Salvando...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}
