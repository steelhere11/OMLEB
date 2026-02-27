"use client";

import { useActionState } from "react";
import type { ActionState } from "@/types/actions";

interface DeleteButtonProps {
  id: string;
  action: (
    prevState: ActionState | null,
    formData: FormData
  ) => Promise<ActionState>;
  confirmMessage?: string;
}

export function DeleteButton({
  id,
  action,
  confirmMessage = "Esta seguro de eliminar este registro?",
}: DeleteButtonProps) {
  const [state, formAction, isPending] = useActionState<
    ActionState | null,
    FormData
  >(action, null);

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={isPending}
          onClick={(e) => {
            if (!confirm(confirmMessage)) {
              e.preventDefault();
            }
          }}
          className="text-[13px] font-medium text-text-3 transition-colors duration-[80ms] hover:text-status-error disabled:opacity-50"
        >
          {isPending ? "..." : "Eliminar"}
        </button>
      </form>
      {state?.error && (
        <p className="mt-1 max-w-xs text-[12px] text-status-error">{state.error}</p>
      )}
    </div>
  );
}
