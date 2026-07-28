import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Zap, ArrowRight, Sparkles } from 'lucide-react';

const plans = [
  {
    key: 'trial',
    name: 'Trial',
    desc: 'Test SnapRules for free, no credit card required.',
    monthlyPrice: 0,
    annualPrice: 0,
    accounts: 1,
    rules: 'Unlimited',
    duration: '7 days',
    isFree: true,
    isPopular: false,
    features: [
      '1 Snapchat account',
      'Unlimited rules',
      'Dashboard & stats',
      'Campaign management',
      '7-day free access',
    ],
    cta: 'Start free trial',
    ctaStyle: 'border',
  },
  {
    key: 'basic',
    name: 'Basic',
    desc: 'For solo media buyers managing a few accounts.',
    monthlyPrice: 15,
    annualPrice: 12,
    accounts: 2,
    rules: 'Unlimited',
    duration: null,
    isFree: false,
    isPopular: false,
    features: [
      '2 Snapchat accounts',
      'Unlimited rules',
      'Dashboard & stats',
      'Campaign management',
      'Email alerts',
    ],
    cta: 'Get started',
    ctaStyle: 'border',
  },
  {
    key: 'pro',
    name: 'Pro',
    desc: 'For growing teams managing multiple clients.',
    monthlyPrice: 35,
    annualPrice: 28,
    accounts: 5,
    rules: 'Unlimited',
    duration: null,
    isFree: false,
    isPopular: true,
    features: [
      '5 Snapchat accounts',
      'Unlimited rules',
      'Advanced dashboard',
      'Campaign management',
      'Email & Slack alerts',
      'Priority support',
    ],
    cta: 'Get started',
    ctaStyle: 'yellow',
  },
  {
    key: 'agency',
    name: 'Agency',
    desc: 'For agencies managing unlimited client accounts.',
    monthlyPrice: 75,
    annualPrice: 60,
    accounts: Infinity,
    rules: 'Unlimited',
    duration: null,
    isFree: false,
    isPopular: false,
    features: [
      'Unlimited Snapchat accounts',
      'Unlimited rules',
      'Advanced dashboard',
      'Campaign management',
      'Email & Slack alerts',
      'Dedicated support',
      'API access',
    ],
    cta: 'Contact us',
    ctaStyle: 'border',
  },
];


export default function PricingPage() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.isFree) return '$0';
    return annual ? `$${plan.annualPrice}` : `$${plan.monthlyPrice}`;
  };

  return (
    <div className="min-h-screen bg-snap-bg">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-snap-border bg-snap-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-snap-yellow flex items-center justify-center">
              <Zap className="h-4 w-4 text-snap-ink" />
            </div>
            <span className="font-semibold text-snap-ink tracking-tight">SnapRules</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/auth/login')}
              className="rounded-xl border border-snap-border bg-snap-card px-4 py-1.5 text-sm font-medium text-snap-ink hover:border-snap-muted transition-all"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="rounded-xl bg-snap-yellow px-4 py-1.5 text-sm font-semibold text-snap-ink hover:brightness-105 transition-all"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-24">

        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-snap-border bg-snap-card px-3 py-1 text-xs font-semibold text-snap-ink">
            <Sparkles className="h-3.5 w-3.5" />
            Simple, transparent pricing
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-semibold text-snap-ink tracking-tight">
            Pay for accounts,<br />
            <span className="relative inline-block">
              not for rules
              <svg className="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path d="M0,5 Q50,1 100,5 T200,4" stroke="#FFFC00" strokeWidth="5" fill="none" />
              </svg>
            </span>
          </h1>
          <p className="mt-5 text-base text-snap-muted max-w-xl mx-auto leading-relaxed">
            All plans include unlimited rules. You only pay for the number of Snapchat accounts you connect.
          </p>

          {/* Toggle annuel/mensuel */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-snap-border bg-snap-card p-1.5">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${!annual ? 'bg-snap-yellow text-snap-ink' : 'text-snap-muted hover:text-snap-ink'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${annual ? 'bg-snap-yellow text-snap-ink' : 'text-snap-muted hover:text-snap-ink'}`}
            >
              Annual
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map(plan => (
            <div
              key={plan.key}
              className={`relative rounded-2xl border p-6 flex flex-col transition-all duration-150 hover:-translate-y-1 ${
                plan.isPopular
                  ? 'border-snap-yellow/40 bg-snap-yellow/5 shadow-lg'
                  : 'border-snap-border bg-snap-card'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-snap-yellow px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-snap-ink">
                    Most popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted">
                  {plan.name}
                </p>
                <div className="mt-3 flex items-end gap-1">
                  <span className={`text-4xl font-semibold ${plan.isPopular ? 'text-yellow-600' : 'text-snap-ink'}`}>
                    {getPrice(plan)}
                  </span>
                  {!plan.isFree && (
                    <span className="mb-1 text-sm text-snap-muted">/mo</span>
                  )}
                </div>
                {annual && !plan.isFree && (
                  <p className="mt-1 text-xs text-snap-muted line-through">${plan.monthlyPrice}/mo</p>
                )}
                {plan.duration && (
                  <span className="mt-2 inline-block rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                    {plan.duration} free
                  </span>
                )}
                <p className="mt-3 text-xs text-snap-muted leading-relaxed">{plan.desc}</p>
              </div>

              {/* Divider */}
              <div className="my-5 border-t border-snap-border" />

              {/* Key stats */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center justify-between rounded-xl bg-snap-soft px-3 py-2">
                  <span className="text-xs text-snap-muted">Snapchat accounts</span>
                  <span className="text-xs font-semibold text-snap-ink">
                    {plan.accounts === Infinity ? 'Unlimited' : plan.accounts}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-snap-soft px-3 py-2">
                  <span className="text-xs text-snap-muted">Rules</span>
                  <span className="text-xs font-semibold text-snap-ink">Unlimited</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-xs text-snap-ink">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => navigate(plan.key === 'agency' ? '/auth/register' : '/auth/register')}
                className={`mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 group ${
                  plan.ctaStyle === 'yellow'
                    ? 'bg-snap-yellow text-snap-ink hover:brightness-105'
                    : 'border border-snap-border bg-snap-soft text-snap-ink hover:border-snap-muted'
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-snap-ink text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. No commitment, no cancellation fees. You can cancel your plan at any time from your account settings.'
              },
              {
                q: 'What counts as a "Snapchat account"?',
                a: 'One Snapchat account = one Snapchat Ads Manager account (ad account). If you manage 3 different ad accounts, you need the Pro plan.'
              },
              {
                q: 'Are rules really unlimited on all plans?',
                a: 'Yes. Unlike competitors who limit rules per plan, SnapRules gives you unlimited rules on every plan — including the free trial.'
              },
              {
                q: 'What happens after the 7-day trial?',
                a: 'After 7 days, you choose a paid plan to continue. No automatic charge — you decide when you\'re ready.'
              },
              {
                q: 'Do you offer discounts for agencies?',
                a: 'The Agency plan already includes unlimited accounts at $75/mo. For very large teams, contact us for a custom deal.'
              },
            ].map(faq => (
              <div key={faq.q} className="rounded-2xl border border-snap-border bg-snap-card p-5">
                <p className="text-sm font-semibold text-snap-ink">{faq.q}</p>
                <p className="mt-2 text-sm text-snap-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-snap-border mt-10">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-snap-yellow flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-snap-ink" />
            </span>
            <span className="font-semibold text-sm text-snap-ink">SnapRules</span>
          </div>
          <p className="text-xs text-snap-muted">Snapchat campaign automation.</p>
          <div className="flex items-center gap-4 text-xs text-snap-muted">
            <button onClick={() => navigate('/')} className="hover:text-snap-ink transition-colors">Home</button>
          </div>
        </div>
      </footer>
    </div>
  );
}