import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../shared/lib/auth';
import { useNavigate, Link } from 'react-router-dom';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2)
});

type FormValues = z.infer<typeof schema>;

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: createUser } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    await createUser(data, true);
    navigate('/auth/login');
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Créer un compte</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nom complet</label>
          <input type="text" {...register('fullName')} className="mt-1 block w-full rounded-lg border border-slate-300 p-2" />
          {errors.fullName && <p className="text-red-600 text-sm">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input type="email" {...register('email')} className="mt-1 block w-full rounded-lg border border-slate-300 p-2" />
          {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
          <input type="password" {...register('password')} className="mt-1 block w-full rounded-lg border border-slate-300 p-2" />
          {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
        </div>
        <button type="submit" className="w-full rounded-lg bg-slate-900 text-white py-2">Créer un compte</button>
      </form>
      <p className="mt-4 text-sm text-slate-600">Déjà inscrit? <Link to="/auth/login" className="text-slate-900">Se connecter</Link></p>
    </div>
  );
};

export default RegisterPage;
