import Image from 'next/image';

import { Link } from '@/lib/i18n/routing';
import { formatPeriod } from '@/lib/utils';
import type { ProjectSummary } from '@/types/content';

export function ProjectCard({ project, present }: { project: ProjectSummary; present: string }) {
  return (
    <article>
      <Link href={`/projects/${project.slug}`} className="group block text-text hover:text-text">
        <div className="relative aspect-16/10 overflow-hidden rounded-md media-slot">
          {project.coverUrl ? (
            <Image
              src={project.coverUrl}
              alt={project.name}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover"
            />
          ) : null}
        </div>
        {project.categoryName ? (
          <p className="mt-3.5 font-heading text-kicker font-bold uppercase text-accent-700">
            {project.categoryName}
          </p>
        ) : null}
        <h3 className="mt-2 font-heading text-[23px] font-bold leading-tight group-hover:text-accent">
          {project.name}
        </h3>
        {project.tagline ? (
          <p className="mt-2 text-[15px] leading-relaxed text-ink-62">{project.tagline}</p>
        ) : null}
        <p className="mt-2.5 text-[13px] text-ink-62">
          {formatPeriod(project.startedAt, project.endedAt, present)}
          {project.tags.length > 0
            ? ` · ${project.tags
                .slice(0, 3)
                .map((tag) => tag.name)
                .join('、')}`
            : ''}
        </p>
      </Link>
    </article>
  );
}
