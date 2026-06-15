"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Coffee } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// Define our validation schema (The FE equivalent of @Valid in Java)
const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Must be a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

import { useRouter } from "next/navigation";
import { useAuthStore, Role } from "@/store/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const resp = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!resp.ok) throw new Error("Authentication failed");
      
      const responseData = await resp.json();
      const token = responseData.token;

      // Parse JWT purely on the frontend to extract roles
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles = payload.roles || [];
      const primaryRole: Role = roles.includes('ADMIN') ? 'ADMIN' : (roles.includes('STAFF') ? 'STAFF' : 'CUSTOMER');

      login(token, primaryRole);
      
      if (primaryRole === 'ADMIN') {
        router.push('/suppliers');
      } else if (primaryRole === 'STAFF') {
        router.push('/kitchen');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      alert(err.message || "Failed to login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-orange rounded-2xl flex items-center justify-center shadow-lg mb-4 transform -rotate-6">
            <Coffee size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-coffee">BrewOps</h1>
          <p className="text-text-secondary mt-2 text-center">
            Enter your credentials to access the enterprise portal
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@brewops.local"
            {...register("email")}
            error={errors.email?.message}
          />
          
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            {...register("password")}
            error={errors.password?.message}
          />

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full mt-6 py-3 text-lg shadow-xl"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Authenticating..." : "Sign In"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
