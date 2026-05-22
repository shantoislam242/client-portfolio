import { LoginForm } from "./login-form";

export const metadata = { title: "Admin login" };

export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-6 text-center">Admin login</h1>
        <LoginForm />
      </div>
    </main>
  );
}
