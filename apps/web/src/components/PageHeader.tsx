type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="space-y-2">
      <h1 className="break-words text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      {description ? <p className="max-w-2xl text-slate-700">{description}</p> : null}
    </div>
  );
}
