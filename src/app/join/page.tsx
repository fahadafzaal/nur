import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Become a Member — NUR" };

export default function JoinPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center px-6 py-14">
      <AuthForm mode="join" />
    </main>
  );
}
