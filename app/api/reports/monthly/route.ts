import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get('month') || new Date().toISOString().slice(0, 7); // YYYY-MM

    const [year, month] = monthStr.split('-').map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: {
        client: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    const settings = await prisma.barberSettings.findUnique({
      where: { userId: session.user.id }
    });

    const totalAppointments = appointments.length;
    const grossRevenue = appointments.reduce((sum, apt) => sum + Number(apt.value), 0);
    const monthlyFixedCost = settings?.monthlyFixedCost ? Number(settings.monthlyFixedCost) : 0;
    const netProfit = grossRevenue - monthlyFixedCost;
    const averageTicket = totalAppointments > 0 ? grossRevenue / totalAppointments : 0;

    // Group by day for chart
    const dailyRevenue: { [key: string]: number } = {};
    appointments.forEach(apt => {
      const day = new Date(apt.date).getDate();
      const dayKey = day.toString();
      dailyRevenue[dayKey] = (dailyRevenue[dayKey] || 0) + Number(apt.value);
    });

    return NextResponse.json({
      month: monthStr,
      totalAppointments,
      grossRevenue,
      monthlyFixedCost,
      netProfit,
      averageTicket,
      dailyRevenue,
      appointments
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório mensal' },
      { status: 500 }
    );
  }
}
