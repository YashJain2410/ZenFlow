import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/UI';
import { signInWithGoogle } from '../lib/firebase';
import { Wind, Mail, Lock, ArrowRight, ChevronLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const LoginScreen = () => {
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithEmail } = useAppContext();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') return;
      if (err.code === 'auth/operation-not-allowed') {
        setError("Google Sign-In is disabled in Firebase Console. Please enable Google provider in Firebase Authentication.");
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Failed to sign in with email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-on-surface">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center space-y-8 text-center w-full max-w-sm"
      >
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-xl ring-1 ring-primary/20">
          <Wind size={48} />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-primary">ZenFlow</h1>
          <p className="text-on-surface-variant text-lg font-medium leading-relaxed">
            Your calm companion for panic relief and mental wellness.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!showEmailLogin ? (
            <motion.div 
              key="social"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full space-y-4 pt-8"
            >
              <Button 
                size="lg" 
                className="w-full py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google" 
                  className="w-6 h-6 mr-3"
                />
                Continue with Google
              </Button>

              <Button 
                variant="ghost"
                size="lg" 
                className="w-full py-6 text-lg font-bold border border-outline-variant/30"
                onClick={() => {
                  setError('');
                  setShowEmailLogin(true);
                }}
              >
                <Mail size={20} className="mr-3" />
                Continue with Email
              </Button>

              {error && <p className="text-error text-xs font-bold pt-2">{error}</p>}
              
              <p className="text-xs text-outline font-medium uppercase tracking-widest pt-4">
                Secure • Private • Compassionate
              </p>
            </motion.div>
          ) : (
            <motion.form 
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleEmailLogin}
              className="w-full space-y-4 pt-8 text-left"
            >
              <button 
                type="button"
                onClick={() => {
                  setError('');
                  setShowEmailLogin(false);
                }}
                className="flex items-center gap-2 text-primary font-bold text-sm mb-4 hover:opacity-80 transition-opacity"
              >
                <ChevronLeft size={16} />
                Back to options
              </button>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-surface-variant/30 border-none rounded-2xl pl-12 pr-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-surface-variant/30 border-none rounded-2xl pl-12 pr-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-error text-xs font-bold ml-1 pt-1">{error}</p>}

              <Button 
                type="submit"
                size="lg" 
                className="w-full py-6 text-lg font-bold shadow-lg mt-4"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Sign In / Sign Up'}
                <ArrowRight size={20} />
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
