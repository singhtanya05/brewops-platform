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

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    // In Step 4, we will connect this to the actual Spring Boot backend
    console.log("Valid form submitted!", data);
    
    // Simulate network delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert("Login successful! Check console for data.");
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
