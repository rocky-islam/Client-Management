import React from 'react';
import Link from 'next/link';
import { ChevronLeft, FolderPlus } from 'lucide-react';
import { ProjectForm } from '@/components/projects/project-form';
import { Button } from '@/components/ui/button';

export default function NewProjectPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/projects">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FolderPlus className="h-6 w-6 text-primary" />
              Add New Project
            </h1>
            <p className="text-xs text-muted-foreground">
              Register a freelance order, assign client, pricing, monthly tracking and delivery dates
            </p>
          </div>
        </div>
      </div>

      <ProjectForm />
    </div>
  );
}

