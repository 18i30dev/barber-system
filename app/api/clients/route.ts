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
    const search = searchParams.get('search');

    let clients;

    if (search) {
      clients = await prisma.client.findMany({
        where: {
          userId: session.user.id,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } }
          ]
        },
        orderBy: {
          name: 'asc'
        }
      });
    } else {
      clients = await prisma.client.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: [
          { lastAppointmentDate: 'desc' },
          { name: 'asc' }
        ]
      });
    }

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Clients fetch error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar clientes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, acceptsWhatsApp } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        userId: session.user.id,
        name,
        phone: phone || null,
        acceptsWhatsApp: acceptsWhatsApp !== false
      }
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Client creation error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    );
  }
}
