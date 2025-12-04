import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let settings = await prisma.barberSettings.findUnique({
      where: { userId: session.user.id }
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.barberSettings.create({
        data: {
          userId: session.user.id
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { barberShopName, monthlyFixedCost, daysToConsiderInactive, reengagementMessage } = body;

    const settings = await prisma.barberSettings.upsert({
      where: { userId: session.user.id },
      update: {
        barberShopName: barberShopName || null,
        monthlyFixedCost: monthlyFixedCost !== undefined ? parseFloat(monthlyFixedCost.toString()) : undefined,
        daysToConsiderInactive: daysToConsiderInactive !== undefined ? parseInt(daysToConsiderInactive.toString()) : undefined,
        reengagementMessage: reengagementMessage || undefined
      },
      create: {
        userId: session.user.id,
        barberShopName: barberShopName || null,
        monthlyFixedCost: monthlyFixedCost ? parseFloat(monthlyFixedCost.toString()) : 0,
        daysToConsiderInactive: daysToConsiderInactive ? parseInt(daysToConsiderInactive.toString()) : 30,
        reengagementMessage: reengagementMessage || "Fala, [NOME_CLIENTE]! Aqui é da [NOME_BARBEARIA], sentimos sua falta por aqui. Que tal marcar um horário essa semana?"
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}
