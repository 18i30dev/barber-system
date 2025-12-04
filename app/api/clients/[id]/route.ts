import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, acceptsWhatsApp } = body;

    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: {
        name: name || client.name,
        phone: phone !== undefined ? phone : client.phone,
        acceptsWhatsApp: acceptsWhatsApp !== undefined ? acceptsWhatsApp : client.acceptsWhatsApp
      }
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Client update error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar cliente' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    await prisma.client.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Cliente removido com sucesso' });
  } catch (error) {
    console.error('Client deletion error:', error);
    return NextResponse.json(
      { error: 'Erro ao remover cliente' },
      { status: 500 }
    );
  }
}
