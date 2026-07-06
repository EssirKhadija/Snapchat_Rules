import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../shared/lib/auth';
import { useNavigate, Link } from 'react-router-dom';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type FormValues = z.infer<typeof schema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    await login(data);
    navigate('/');
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-snap-yellow flex items-center justify-center">
          <span className="text-snap-ink text-sm font-bold">S</span>
        </div>
        <span className="text-lg font-semibold text-snap-ink">SnapRules</span>
      </div>

      <h1 className="text-2xl font-semibold text-snap-ink">Connexion</h1>
      <p className="mt-1 text-sm text-snap-muted">Gérez vos règles Snapchat Ads.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-2">
            Email
          </label>
          <input
            type="email"
            {...register('email')}
            placeholder="vous@exemple.com"
            className="block w-full rounded-xl border border-snap-border bg-snap-soft px-4 py-3 text-sm text-snap-ink placeholder:text-snap-muted focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200 transition-all"
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mb-2">
            Mot de passe
          </label>
          <input
            type="password"
            {...register('password')}
            placeholder="••••••••"
            className="block w-full rounded-xl border border-snap-border bg-snap-soft px-4 py-3 text-sm text-snap-ink placeholder:text-snap-muted focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200 transition-all"
          />
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-snap-yellow py-3 text-sm font-semibold text-snap-ink hover:brightness-105 active:scale-[0.98] transition-all duration-150"
        >
          Se connecter
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-snap-muted">
        Pas encore de compte?{' '}
        <Link to="/auth/register" className="font-semibold text-snap-ink hover:text-yellow-600 transition-colors">
          Créer un compte
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;