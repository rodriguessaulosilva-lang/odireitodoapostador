import PageHeader from "@/components/PageHeader";

export default function EmBreve({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <div className="p-6">
        <div className="card flex flex-col items-center justify-center p-16 text-center">
          <div className="mb-3 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            Próxima etapa
          </div>
          <p className="max-w-md text-sm text-slate-500">{desc}</p>
        </div>
      </div>
    </div>
  );
}
