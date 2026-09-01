"use client";

import { useActionState } from "react";
import { createGroup, deleteGroup } from "../actions";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

interface Props {
  groups: { id: string; name: string; _count: { members: number } }[];
}

export default function GroupsForm({ groups }: Props) {
  const [state, formAction, pending] = useActionState(createGroup, undefined);

  return (
    <div className="space-y-3">
      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <form key={g.id} action={deleteGroup.bind(null, g.id)}>
              <ConfirmSubmitButton
                confirmMessage={`Izbrisati skupino "${g.name}"? Članom bo odstranjena iz seznama skupin.`}
                pendingLabel="..."
                className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:border-red-300 hover:text-red-600 transition-colors"
              >
                {g.name}
                <span className="text-ink-dim">({g._count.members})</span>
                <span aria-hidden>&times;</span>
              </ConfirmSubmitButton>
            </form>
          ))}
        </div>
      )}

      <form action={formAction} className="flex items-end gap-2 max-w-sm">
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1" htmlFor="groupName">
            Nova skupina
          </label>
          <input
            id="groupName"
            name="name"
            required
            placeholder="npr. Četrtkova odbojka"
            className="w-full rounded-lg border border-border bg-[#fafbfd] px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-alt transition-colors disabled:opacity-60"
        >
          {pending ? "..." : "Dodaj"}
        </button>
      </form>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
    </div>
  );
}
