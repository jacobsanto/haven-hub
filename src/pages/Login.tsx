import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, isAdmin } = useAuth();
  const { brandName } = useBrand();
  const { toast } = useToast();
  
  // Split brand name for styling
  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;
  const secondaryPart = nameParts.slice(1).join(' ');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({
      title: 'Welcome back!',
      description: 'You have successfully signed in.',
    });

    // Redirect based on role
    navigate('/admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="block text-center mb-8">
          <h1 className="text-3xl font-serif">
            <span className="text-primary">{primaryPart}</span>
            {secondaryPart && <span className="text-muted-foreground"> {secondaryPart}</span>}
          </h1>
        </Link>

        <div className="card-organic p-8">
          <h2 className="text-2xl font-serif font-medium text-center mb-2">
            Welcome Back
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Sign in to access your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input-organic"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-organic"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-organic"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          <Link to="/" className="hover:text-foreground transition-colors">
            ← Back to Home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
