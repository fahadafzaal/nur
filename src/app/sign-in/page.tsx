import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Sign In — NUR" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-6 py-14">
      <AuthForm mode="sign-in" next={next} />
    </main>
  );
}
