import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ProjectForm } from '@/components/projects/project-form';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EditProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Link href={`/projects/${project.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Edit className="h-6 w-6 text-primary" />
            Edit Project: {project.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            Order ID: {project.orderId} • Update deliverables, pricing, statuses or deadlines
          </p>
        </div>
      </div>

      <ProjectForm initialData={JSON.parse(JSON.stringify(project))} isEditing={true} />
    </div>
  );
}
