import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../shared/lib/auth';
import { useTranslation } from '../../shared/lib/i18n';
import { useNavigate, Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type FormValues = z.infer<typeof schema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    await login(data);
    navigate('/dashboard');
  };

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        
        <h1 className="mt-3 font-display text-3xl font-semibold text-snap-ink">{t('auth.login.title')}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-snap-muted">
            {t('auth.login.email')}
          </label>
          <input
            type="email"
            {...register('email')}
            placeholder="vous@exemple.com"
            className="block w-full rounded-2xl border border-snap-border bg-snap-soft px-4 py-3 text-sm text-snap-ink placeholder:text-snap-muted transition-all duration-150 focus:border-snap-yellow focus:outline-none focus:ring-2 focus:ring-snap-yellow/25"
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-snap-muted">
            {t('auth.login.password')}
          </label>
          <input
            type="password"
            {...register('password')}
            placeholder="••••••••"
            className="block w-full rounded-2xl border border-snap-border bg-snap-soft px-4 py-3 text-sm text-snap-ink placeholder:text-snap-muted transition-all duration-150 focus:border-snap-yellow focus:outline-none focus:ring-2 focus:ring-snap-yellow/25"
          />
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-2xl bg-snap-yellow py-3 text-sm font-semibold text-snap-ink transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0"
        >
          {t('auth.login.submit')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-snap-muted">
        {t('auth.login.noAccount')}{' '}
        <Link to="/auth/register" className="font-semibold text-snap-ink transition-colors hover:text-snap-yellow">
          {t('auth.login.register')}
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;


