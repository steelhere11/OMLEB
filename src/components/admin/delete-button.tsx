"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
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
        <Button
          type="submit"
          variant="danger"
          size="sm"
          loading={isPending}
          onClick={(e) => {
            if (!confirm(confirmMessage)) {
              e.preventDefault();
            }
          }}
        >
          Eliminar
        </Button>
      </form>
      {state?.error && (
        <p className="mt-1.5 max-w-xs text-xs text-red-400">{state.error}</p>
      )}
    </div>
  );
}
