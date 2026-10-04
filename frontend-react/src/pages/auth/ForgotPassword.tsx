import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/auth.service';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please check and try again.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await authService.forgotPassword(email, newPassword);
      setSuccessMsg(res || 'Your password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/auth/login');
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.response?.data || 'Failed to reset password. Please verify your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden text-slate-100">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Back Link */}
        <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white">Reset Password</h1>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            Enter your registered email address and choose a new password for your LandLens account.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2.5 text-red-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Input */}
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1.5" htmlFor="email">Registered Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input 
                id="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-xs"
                placeholder="you@domain.com" />
            </div>
          </div>

          {/* New Password Input */}
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1.5" htmlFor="newPassword">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input 
                id="newPassword"
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-xs"
                placeholder="At least 6 characters" />
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1.5" htmlFor="confirmPassword">Confirm New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input 
                id="confirmPassword"
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-xs"
                placeholder="Re-type new password" />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={!email || !newPassword || !confirmPassword || loading}
            className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-xs flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

      </div>
    </div>
  );
};
