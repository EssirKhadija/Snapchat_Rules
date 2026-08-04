import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../shared/lib/auth';
import { useTranslation } from '../../shared/lib/i18n';
import { useNavigate, Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2)
});

type FormValues = z.infer<typeof schema>;

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: createUser } = useAuth();
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    await createUser({ email: data.email, password: data.password, fullName: data.fullName });
    navigate('/auth/login');
  };

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        
        <h1 className="mt-3 font-display text-3xl font-semibold text-snap-ink">{t('auth.register.title')}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-snap-muted">{t('auth.register.fullName')}</label>
          <input
            type="text"
            {...register('fullName')}
            className="block w-full rounded-2xl border border-snap-border bg-snap-soft px-4 py-3 text-sm text-snap-ink placeholder:text-snap-muted transition-all duration-150 focus:border-snap-yellow focus:outline-none focus:ring-2 focus:ring-snap-yellow/25"
          />
          {errors.fullName && <p className="mt-1.5 text-xs text-red-500">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-snap-muted">{t('auth.register.email')}</label>
          <input
            type="email"
            {...register('email')}
            className="block w-full rounded-2xl border border-snap-border bg-snap-soft px-4 py-3 text-sm text-snap-ink placeholder:text-snap-muted transition-all duration-150 focus:border-snap-yellow focus:outline-none focus:ring-2 focus:ring-snap-yellow/25"
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-snap-muted">{t('auth.register.password')}</label>
          <input
            type="password"
            {...register('password')}
            className="block w-full rounded-2xl border border-snap-border bg-snap-soft px-4 py-3 text-sm text-snap-ink placeholder:text-snap-muted transition-all duration-150 focus:border-snap-yellow focus:outline-none focus:ring-2 focus:ring-snap-yellow/25"
          />
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <button
          type="submit"
          className="w-full rounded-2xl bg-snap-yellow py-3 text-sm font-semibold text-snap-ink transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0"
        >
          {t('auth.register.submit')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-snap-muted">
        {t('auth.register.already')}{' '}
        <Link to="/auth/login" className="font-semibold text-snap-ink transition-colors hover:text-snap-yellow">
          {t('auth.register.login')}
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
