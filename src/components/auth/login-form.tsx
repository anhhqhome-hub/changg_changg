"use client";

import { useActionState } from "react";
import { signInAction, type LoginActionState } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: LoginActionState = {};

export function LoginForm({
  usernameLabel,
  passwordLabel,
  submitLabel,
  pendingLabel
}: {
  usernameLabel: string;
  passwordLabel: string;
  submitLabel: string;
  pendingLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  return (
    <form action={formAction} className="grid gap-4">
      {state.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">
          {state.error}
        </div>
      ) : null}
      <label className="grid gap-1 text-sm font-medium">
        {usernameLabel}
        <Input name="username" required autoComplete="username" minLength={3} maxLength={30} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        {passwordLabel}
        <Input name="password" type="password" required autoComplete="current-password" minLength={8} />
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? (pendingLabel ?? "Đang đăng nhập...") : submitLabel}
      </Button>
    </form>
  );
}
