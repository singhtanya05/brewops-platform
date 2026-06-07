import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Home() {
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center gap-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-coffee">BrewOps Enterprise</h1>
        <p className="text-text-secondary text-lg">
          Welcome to the new component-driven Next.js frontend!
        </p>
      </div>

      <Card className="max-w-md w-full space-y-6">
        <h2 className="text-2xl font-bold">Component Demo</h2>
        <p className="text-text-secondary">
          This is our reusable <code>&lt;Card&gt;</code> component containing three instances of our reusable <code>&lt;Button&gt;</code> component.
        </p>
        
        <div className="flex flex-col gap-4">
          <Button variant="primary">Primary Button</Button>
          <Button variant="matcha">Matcha Button</Button>
          <Button variant="secondary">Secondary Button</Button>
        </div>
      </Card>
    </div>
  );
}
