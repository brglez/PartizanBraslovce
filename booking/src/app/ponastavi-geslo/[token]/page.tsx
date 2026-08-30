import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-head text-2xl font-extrabold text-navy mb-1">Novo geslo</h1>
      <p className="text-ink-dim text-sm mb-6">Vnesi novo geslo za svoj račun.</p>
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
