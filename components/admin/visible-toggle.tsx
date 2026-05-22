"use client";
import { useTransition } from "react";

type VisibleToggleProps = {
  id: string;
  visible: boolean;
  action: (formData: FormData) => Promise<unknown>;
};

export function VisibleToggle({ id, visible, action }: VisibleToggleProps) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(fd) =>
        startTransition(() => {
          fd.set("id", id);
          fd.set("visible", visible ? "false" : "true");
          return action(fd) as Promise<void>;
        })
      }
    >
      <button
        type="submit"
        disabled={pending}
        aria-label={visible ? "Hide" : "Show"}
        className={
          "h-5 w-9 rounded-full transition " +
          (visible ? "bg-accent-purple" : "bg-muted")
        }
      >
        <span
          className={
            "block h-4 w-4 rounded-full bg-white transition transform " +
            (visible ? "translate-x-4" : "translate-x-0.5")
          }
        />
      </button>
    </form>
  );
}
