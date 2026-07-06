interface Props {
  text: string;
  variant?: 'success' | 'warning' | 'error' | 'default';
}

const classes = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-rose-100 text-rose-700',
  default: 'bg-slate-100 text-slate-700'
};

const CampaignBadge = ({ text, variant = 'default' }: Props) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${classes[variant]}`}>
    {text}
  </span>
);

export default CampaignBadge;
