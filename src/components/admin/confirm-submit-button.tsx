"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

type Props = {
  message: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Bouton de soumission avec confirmation native (window.confirm) avant action.
 * À utiliser dans un <form action={serverAction}> pour les opérations destructives.
 * Affiche un loader pendant la soumission.
 */
export function ConfirmSubmitButton({ message, className, children }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        // Confirm bloquant : s'il refuse, on empêche la soumission du form.
        if (!window.confirm(message)) {
          e.preventDefault();
        }
      }}
      className={className}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Suppression…
        </>
      ) : (
        children
      )}
    </button>
  );
}
