import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { loginUser, setApiToken } from '@/services/backend';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn, UtensilsCrossed } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Try backend login first (required for Razorpay payment)
      const backendResult = await loginUser(email.trim(), password);
      if (backendResult.success && backendResult.token && backendResult.user) {
        setApiToken(backendResult.token);
        login({
          id: String(backendResult.user.id),
          email: backendResult.user.email,
          password: '',
          name: backendResult.user.fullName,
          role: backendResult.user.role,
          createdAt: new Date().toISOString(),
        });
        toast({ title: 'Welcome back!', description: `Logged in as ${backendResult.user.fullName}` });
        navigate('/dashboard');
        return;
      }

      // Fallback to mock API only when backend is unreachable (for demo)
      const mockResponse = api.login(email, password);
      if (mockResponse.success && mockResponse.data) {
        login(mockResponse.data);
        toast({ title: 'Welcome back!', description: `Logged in as ${mockResponse.data.name} (demo mode)` });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Login Failed',
          description: backendResult.message || mockResponse.error || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-secondary to-background py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <p className="font-chef text-xs tracking-widest text-green-500 mb-4">WELCOME BACK</p>
            <h1 className="font-display text-3xl font-bold text-charcoal">Sign In</h1>
            <div className="w-12 h-0.5 bg-charcoal mx-auto mt-4" />
          </div>
          
          <Card className="chef-card border border-gray-200 shadow-kitchen">
            <CardContent className="pt-8 pb-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-chef text-xs tracking-wider text-charcoal">EMAIL</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-chef text-xs tracking-wider text-charcoal">PASSWORD</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-charcoal"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full btn-chef mt-6" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <UtensilsCrossed className="w-4 h-4 mr-2 animate-spin" />
                      PREPARING...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      SIGN IN
                    </>
                  )}
                </Button>
              </form>

              {/* Demo credentials */}
              <div className="mt-8 p-4 bg-secondary rounded-sm border border-gray-200">
                <p className="font-chef text-[10px] tracking-widest text-muted-foreground mb-3">DEMO CREDENTIALS</p>
                <div className="space-y-2 text-sm">
                  <p><span className="text-charcoal font-medium">Admin:</span> <span className="text-muted-foreground">admin@zynk.com / admin123</span></p>
                  <p><span className="text-charcoal font-medium">Delivery:</span> <span className="text-muted-foreground">delivery@zynk.com / delivery123</span></p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-green-500 hover:text-green-500-dark font-medium">
                    Create one
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
