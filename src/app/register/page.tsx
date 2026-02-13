"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import RegisterForm from "@/components/RegisterForm";
import { toast } from "sonner";

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error === "notfound") {
      toast.error("Faça o registro para fazer o login.");
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Create your account
        </h1>
        <RegisterForm />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageContent />
    </Suspense>
  );
}
