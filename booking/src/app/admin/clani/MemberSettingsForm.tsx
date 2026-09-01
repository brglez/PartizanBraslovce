"use client";

import { useFormStatus } from "react-dom";
import { updateMemberSettings } from "../actions";

interface Props {
  userId: string;
  groups: { id: string; name: string }[];
  memberGroupIds: string[];
  notifyOptIn: boolean;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-navy/10 px-3 py-1 text-xs font-semibold text-navy hover:bg-navy/20 transition-colors disabled:opacity-60"
    >
      {pending ? "Shranjujem ..." : "Shrani"}
    </button>
  );
}

export default function MemberSettingsForm({ userId, groups, memberGroupIds, notifyOptIn }: Props) {
  return (
    <form
      action={updateMemberSettings.bind(null, userId)}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full mt-2 pt-2 border-t border-border/60"
    >
      {groups.length === 0 ? (
        <span className="text-xs text-ink-dim">Ni še ustvarjenih skupin.</span>
      ) : (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {groups.map((g) => (
            <label key={g.id} className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                name="groupIds"
                value={g.id}
                defaultChecked={memberGroupIds.includes(g.id)}
                className="accent-accent"
              />
              {g.name}
            </label>
          ))}
        </div>
      )}
      <label className="flex items-center gap-1.5 text-xs font-semibold">
        <input
          type="checkbox"
          name="notifyOptIn"
          defaultChecked={notifyOptIn}
          className="accent-accent"
        />
        Obveščaj po e-pošti
      </label>
      <SaveButton />
    </form>
  );
}
