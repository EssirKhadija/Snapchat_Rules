import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Zap,
  BarChart3,
  Bell,
  Link2,
  LayoutDashboard,
  SlidersHorizontal,
  Activity,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  History,
  MousePointerClick,
  Gauge,
} from "lucide-react";

/* =========================================================================
   PALETTE
   Le jaune #FFFC00 reste la couleur de marque ; chaque section pioche dans
   une famille de teintes chaudes/froides pour éviter l'effet "noir & blanc".
   Les couleurs sont appliquées via de vraies classes CSS (définies dans
   GlobalStyles) plutôt que des classes Tailwind arbitraires, qui ne sont
   pas compilées dans cet environnement d'artefact.
   ========================================================================= */
const ACCENTS = [
  { name: "yellow", bgClass: "sr-acc-yellow", softClass: "sr-acc-yellow-soft", textClass: "sr-text-onaccent-dark", ring: "#FFFC00" },
  { name: "coral", bgClass: "sr-acc-coral", softClass: "sr-acc-coral-soft", textClass: "text-white", ring: "#FF6B4A" },
  { name: "blue", bgClass: "sr-acc-blue", softClass: "sr-acc-blue-soft", textClass: "text-white", ring: "#3E7BFA" },
  { name: "violet", bgClass: "sr-acc-violet", softClass: "sr-acc-violet-soft", textClass: "text-white", ring: "#8B5CF6" },
  { name: "green", bgClass: "sr-acc-green", softClass: "sr-acc-green-soft", textClass: "text-white", ring: "#22C55E" },
  { name: "pink", bgClass: "sr-acc-pink", softClass: "sr-acc-pink-soft", textClass: "text-white", ring: "#FF4FA3" },
] as const;

type Accent = (typeof ACCENTS)[number];
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface MetricTileProps {
  label: string;
  value: string;
  trend: string;
  up?: boolean;
  icon: IconComponent;
  iconColor?: string;
}

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

/* Nuages de couleur en fond, très doux */
function ColorBlobs({ className = "" }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full" style={{ backgroundColor: "rgba(255,252,0,0.3)", filter: "blur(90px)" }} />
      <div className="absolute top-10 right-0 h-64 w-64 rounded-full" style={{ backgroundColor: "rgba(255,107,74,0.2)", filter: "blur(90px)" }} />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full" style={{ backgroundColor: "rgba(62,123,250,0.15)", filter: "blur(100px)" }} />
      <div className="absolute -bottom-10 right-1/4 h-56 w-56 rounded-full" style={{ backgroundColor: "rgba(139,92,246,0.15)", filter: "blur(90px)" }} />
    </div>
  );
}

/* =========================================================================
   FONTS + KEYFRAME ANIMATIONS + CLASSES CSS RÉELLES POUR LES COULEURS
   ========================================================================= */
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

      .sr-display { font-family: 'Space Grotesk', ui-sans-serif, sans-serif; }
      .sr-body { font-family: 'Inter', ui-sans-serif, sans-serif; }
      .sr-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }

      /* ---- Thème : variables de couleur ---- */
      .sr-theme {
        --sr-bg: #f3f1ea;
        --sr-surface: #ffffff;
        --sr-soft: #ece8e0;
        --sr-border: #e2ddd2;
        --sr-muted: #9c9890;
        --sr-text: #1a1a18;
        --sr-nav-bg: rgba(243, 241, 234, 0.85);
      }

      /* ---- Classes utilitaires de couleur (remplacent les classes Tailwind arbitraires) ---- */
      .sr-text-main { color: var(--sr-text); }
      .sr-text-muted { color: var(--sr-muted); }
      .sr-bg-page { background-color: var(--sr-bg); }
      .sr-bg-surface { background-color: var(--sr-surface); }
      .sr-bg-soft { background-color: var(--sr-soft); }
      .sr-bg-borderc { background-color: var(--sr-border); }
      .sr-border { border-color: var(--sr-border); }
      .sr-border-main { border-color: var(--sr-text); }

      .sr-bg-yellow { background-color: #FFFC00; }
      .sr-bg-dark { background-color: #1a1a18; }
      .sr-text-dark { color: #1a1a18; }
      .sr-text-yellow { color: #FFFC00; }
      .sr-border-yellow { border-color: #FFFC00; }

      .sr-acc-yellow { background-color: #FFFC00; }
      .sr-acc-coral { background-color: #FF6B4A; }
      .sr-acc-blue { background-color: #3E7BFA; }
      .sr-acc-violet { background-color: #8B5CF6; }
      .sr-acc-green { background-color: #22C55E; }
      .sr-acc-pink { background-color: #FF4FA3; }
      .sr-text-onaccent-dark { color: #1a1a18; }

      .sr-acc-yellow-soft { background-color: rgba(255,252,0,0.15); }
      .sr-acc-coral-soft { background-color: rgba(255,107,74,0.12); }
      .sr-acc-blue-soft { background-color: rgba(62,123,250,0.12); }
      .sr-acc-violet-soft { background-color: rgba(139,92,246,0.12); }
      .sr-acc-green-soft { background-color: rgba(34,197,94,0.12); }
      .sr-acc-pink-soft { background-color: rgba(255,79,163,0.12); }

      .sr-text-11 { font-size: 11px; }
      .sr-text-12 { font-size: 12px; }
      .sr-text-13 { font-size: 13px; }
      .sr-text-15 { font-size: 15px; }
      .sr-text-hero { font-size: 2.25rem; line-height: 1.1; }
      .sr-text-cta { font-size: 1.875rem; }
      @media (min-width: 640px) {
        .sr-text-hero { font-size: 3rem; }
        .sr-text-cta { font-size: 2.6rem; }
      }
      @media (min-width: 1024px) {
        .sr-text-hero { font-size: 3.4rem; }
      }

      .sr-fade-b { background: linear-gradient(to bottom, var(--sr-surface), transparent); }
      .sr-fade-t { background: linear-gradient(to top, var(--sr-surface), transparent); }

      @keyframes sr-draw {
        to { stroke-dashoffset: 0; }
      }
      @keyframes sr-ticker {
        0% { transform: translateY(0); }
        100% { transform: translateY(-50%); }
      }
      @keyframes sr-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(255,252,0,0.55); }
        70% { box-shadow: 0 0 0 9px rgba(255,252,0,0); }
      }
      @keyframes sr-pulse-green {
        0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.45); }
        70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
      }
      @keyframes sr-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
      }
      @keyframes sr-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      @keyframes sr-fade-up {
        from { opacity: 0; transform: translateY(22px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes sr-sweep {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(220%); }
      }

      .sr-reveal { opacity: 0; }
      .sr-reveal.sr-in { animation: sr-fade-up 0.7s cubic-bezier(.2,.7,.3,1) forwards; }

      .sr-ticker-track { animation: sr-ticker 9s linear infinite; }
      .sr-blink-cursor { animation: sr-blink 0.9s step-end infinite; }
      .sr-float { animation: sr-float 4.5s ease-in-out infinite; }
      .sr-pulse-dot { animation: sr-pulse 2.2s ease-out infinite; }
      .sr-pulse-dot-green { animation: sr-pulse-green 2.2s ease-out infinite; }
      .sr-sweep { animation: sr-sweep 3.2s ease-in-out infinite; }

      /* ---- Animations des cartes ---- */
      @keyframes sr-icon-pop {
        0% { transform: scale(1) rotate(0deg); }
        45% { transform: scale(1.22) rotate(10deg); }
        100% { transform: scale(1.1) rotate(6deg); }
      }
      @keyframes sr-badge-pop {
        0% { transform: scale(1); }
        50% { transform: scale(1.25); }
        100% { transform: scale(1.12); }
      }
      @keyframes sr-border-glow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(255,252,0,0.45), 0 20px 40px -20px rgba(26,26,24,0.3); }
        50% { box-shadow: 0 0 0 6px rgba(255,252,0,0), 0 20px 40px -20px rgba(26,26,24,0.3); }
      }

      .sr-card {
        transition: transform 0.3s cubic-bezier(.2,.7,.3,1), box-shadow 0.3s ease, border-color 0.3s ease;
      }
      .sr-card:hover {
        transform: translateY(-6px) scale(1.015);
        border-color: #FFFC00;
        animation: sr-border-glow 1.6s ease-out;
      }
      .sr-card:active {
        transform: translateY(-2px) scale(0.99);
      }

      .sr-anim-icon {
        transition: transform 0.3s ease;
      }
      .group:hover .sr-anim-icon,
      .sr-card:hover .sr-anim-icon {
        animation: sr-icon-pop 0.45s ease-out forwards;
      }

      .sr-anim-badge {
        transition: transform 0.3s ease, color 0.3s ease;
      }
      .sr-card:hover .sr-anim-badge {
        animation: sr-badge-pop 0.4s ease-out forwards;
        color: #FFFC00 !important;
      }

      .sr-connector {
        background-color: var(--sr-border);
        transition: background-color 0.3s ease, height 0.3s ease;
      }
      .sr-card:hover .sr-connector {
        background-color: #FFFC00;
        height: 2px;
      }

      .sr-row-anim {
        transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
      }
      .sr-row-anim:hover {
        transform: translateX(4px);
        border-color: #FFFC00;
        box-shadow: 0 8px 20px -12px rgba(26,26,24,0.25);
      }
      .sr-row-anim:hover .sr-anim-icon {
        animation: sr-icon-pop 0.45s ease-out forwards;
      }

      @media (prefers-reduced-motion: reduce) {
        .sr-reveal { opacity: 1 !important; animation: none !important; }
        .sr-ticker-track, .sr-blink-cursor, .sr-float, .sr-pulse-dot, .sr-pulse-dot-green, .sr-sweep, .sr-draw {
          animation: none !important;
        }
      }
    `}</style>
  );
}

/* ---------- Scroll reveal wrapper ---------- */
function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`sr-reveal ${inView ? "sr-in" : ""} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------- Count-up on view ---------- */
function useCountUp(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number | null = null;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(progress * target);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [active, target, duration]);
  return value;
}

/* ---------- Typewriter for the rule snippet ---------- */
function useTypewriter(text: string, active: boolean, speed = 38, restartDelay = 3200) {
  const [display, setDisplay] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) return;
    let i = 0;
    let typeId: ReturnType<typeof setInterval> | undefined;
    let loopId: ReturnType<typeof setTimeout> | undefined;

    const run = () => {
      i = 0;
      setDone(false);
      setDisplay("");
      typeId = setInterval(() => {
        i += 1;
        setDisplay(text.slice(0, i));
        if (i >= text.length) {
          if (typeId) clearInterval(typeId);
          setDone(true);
          loopId = setTimeout(run, restartDelay);
        }
      }, speed);
    };
    run();

    return () => {
      if (typeId) clearInterval(typeId);
      if (loopId) clearTimeout(loopId);
    };
  }, [active, text, speed, restartDelay]);

  return { display, done };
}

/* =========================================================================
   HERO — LIVE DASHBOARD MOCKUP
   ========================================================================= */
function HeroPanel() {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(true);
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const budget = useCountUp(4820, active);
  const impressions = useCountUp(182300, active);
  const ctr = useCountUp(2.84, active);
  const cpm = useCountUp(18.6, active);

  const { display: ruleText, done: ruleDone } = useTypewriter(
    "IF cpm > $20.00 THEN pause_campaign()",
    active
  );

  const activity = [
    { icon: CheckCircle2, text: 'Rule "High CPM" triggered on Summer Campaign', color: "text-emerald-600" },
    { icon: Bell, text: "Alert: daily budget reached 90%", color: "sr-text-main" },
    { icon: TrendingUp, text: "CTR up 12% on Ad Set #4", color: "text-emerald-600" },
    { icon: History, text: "History updated — 6 actions this hour", color: "sr-text-muted" },
  ];

  return (
    <div ref={ref} className="relative sr-float">
      {/* halo doux derrière le panneau */}
      <div className="absolute -inset-6 rounded-3xl" style={{ backgroundColor: "rgba(255,252,0,0.25)", filter: "blur(64px)" }} aria-hidden="true" />

      <div className="relative rounded-2xl border sr-border sr-bg-surface overflow-hidden" style={{ boxShadow: "0 20px 60px -15px rgba(26,26,24,0.25)" }}>
        {/* barre de navigateur */}
        <div className="flex items-center gap-2 border-b sr-border sr-bg-soft px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full sr-bg-borderc" />
          <span className="h-2.5 w-2.5 rounded-full sr-bg-borderc" />
          <span className="h-2.5 w-2.5 rounded-full sr-bg-borderc" />
          <div className="ml-3 flex-1 rounded-md sr-bg-surface border sr-border px-3 py-1 text-xs sr-mono sr-text-muted">
            app.snaprules.com/dashboard
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* métriques */}
          <div className="grid grid-cols-2 gap-3">
            <MetricTile label="Budget spent" value={`$${budget.toFixed(0)}`} trend="+4.2%" up icon={Gauge} iconColor="#3E7BFA" />
            <MetricTile label="Impressions" value={impressions.toFixed(0)} trend="+18%" up icon={MousePointerClick} iconColor="#8B5CF6" />
            <MetricTile label="CTR" value={`${ctr.toFixed(2)}%`} trend="+0.3 pt" up icon={TrendingUp} iconColor="#22C55E" />
            <MetricTile label="CPM" value={`$${cpm.toFixed(1)}`} trend="-2.1%" icon={TrendingDown} iconColor="#FF6B4A" />
          </div>

          {/* courbe animée */}
          <div className="rounded-xl border sr-border sr-bg-soft p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium sr-text-muted sr-body">Performance — last 7 days</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 sr-body">
                <TrendingUp className="h-3.5 w-3.5" /> +23%
              </span>
            </div>
            <svg viewBox="0 0 300 80" className="w-full h-16" aria-hidden="true">
              <defs>
                <linearGradient id="sr-line-gradient" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#3E7BFA" />
                  <stop offset="55%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#FF6B4A" />
                </linearGradient>
                <linearGradient id="sr-area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points="0,60 40,52 80,58 120,40 160,44 200,22 240,28 300,10 300,80 0,80"
                fill="url(#sr-area-gradient)"
              />
              <polyline
                points="0,60 40,52 80,58 120,40 160,44 200,22 240,28 300,10"
                fill="none"
                stroke="var(--sr-border)"
                strokeWidth="2"
              />
              <polyline
                points="0,60 40,52 80,58 120,40 160,44 200,22 240,28 300,10"
                fill="none"
                stroke="url(#sr-line-gradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="420"
                strokeDashoffset={active ? 0 : 420}
                style={{ transition: "stroke-dashoffset 1.8s ease" }}
                className="sr-draw"
              />
              <circle cx="300" cy="10" r="4" fill="#FFFC00" stroke="var(--sr-text)" strokeWidth="1.5" />
            </svg>
          </div>

          {/* règle qui s'écrit */}
          <div className="rounded-xl border border-white/10 sr-bg-dark p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/50 sr-body">Active rule</span>
              <span
                className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 sr-text-11 font-semibold sr-body transition-colors ${ruleDone ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/40"
                  }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${ruleDone ? "bg-emerald-400 sr-pulse-dot-green" : "bg-white/40"
                    }`}
                />
                {ruleDone ? "Active" : "Compiling…"}
              </span>
            </div>
            <p className="sr-mono text-sm sr-text-yellow" style={{ minHeight: "1.5rem" }}>
              {ruleText}
              <span className="sr-blink-cursor">▍</span>
            </p>
          </div>

          {/* flux d'activité défilant */}
          <div className="rounded-xl border sr-border overflow-hidden relative" style={{ height: "84px" }}>
            <div className="absolute inset-x-0 top-0 h-4 sr-fade-b z-10" />
            <div className="absolute inset-x-0 bottom-0 h-4 sr-fade-t z-10" />
            <div className="sr-ticker-track">
              {[...activity, ...activity].map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 text-xs sr-body sr-text-main">
                  <item.icon className={`h-3.5 w-3.5 shrink-0 ${item.color}`} />
                  <span className="truncate">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value, trend, up, icon: Icon, iconColor = "#9c9890" }: MetricTileProps) {
  return (
    <div className="rounded-xl border sr-border sr-bg-surface p-3">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
        <span className={`sr-text-11 font-semibold sr-body ${up ? "text-emerald-600" : "sr-text-muted"}`}>
          {trend}
        </span>
      </div>
      <p className="mt-2 text-lg font-semibold sr-text-main sr-display leading-none">{value}</p>
      <p className="sr-text-11 sr-text-muted sr-body mt-1">{label}</p>
    </div>
  );
}

/* =========================================================================
   PETITS BLOCS RÉUTILISABLES
   ========================================================================= */
function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border sr-border sr-bg-surface px-3 py-1 text-xs font-semibold sr-text-main sr-body">
      {children}
    </span>
  );
}

function PrimaryButton({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`group inline-flex items-center justify-center gap-2 rounded-xl sr-bg-yellow px-5 py-3 text-sm font-semibold sr-text-dark sr-body transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 ${className}`}
      style={{ boxShadow: "0 1px 0 0 rgba(0,0,0,0.05)" }}
      {...props}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl border sr-border sr-bg-surface px-5 py-3 text-sm font-semibold sr-text-main sr-body transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function FeatureCard({ icon: Icon, title, desc, delay, accent = ACCENTS[0] }: { icon: IconComponent; title: string; desc: string; delay: number; accent?: Accent }) {
  return (
    <Reveal delay={delay}>
      <div className="sr-card group relative h-full overflow-hidden rounded-2xl border-2 sr-border-yellow sr-bg-surface p-6">
        <div
          className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
          style={{ backgroundColor: accent.ring }}
        />
        <div
          className={`sr-anim-icon inline-flex items-center justify-center h-11 w-11 rounded-xl ${accent.bgClass}`}
        >
          <Icon className={`h-5 w-5 ${accent.textClass}`} />
        </div>
        <h3 className="mt-4 text-base font-semibold sr-text-main sr-display">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed sr-text-muted sr-body">{desc}</p>
      </div>
    </Reveal>
  );
}

function BenefitItem({ icon: Icon, title, desc, delay, accent = ACCENTS[0] }: { icon: IconComponent; title: string; desc: string; delay: number; accent?: Accent }) {
  return (
    <Reveal delay={delay} className="flex gap-4">
      <div className={`shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-full ${accent.softClass}`}>
        <Icon className="h-4.5 w-4.5" style={{ color: accent.ring }} />
      </div>
      <div>
        <h4 className="text-sm font-semibold sr-text-main sr-display">{title}</h4>
        <p className="mt-1 text-sm sr-text-muted sr-body leading-relaxed">{desc}</p>
      </div>
    </Reveal>
  );
}

function StepCard({ number, icon: Icon, title, desc, delay, accent = ACCENTS[0] }: { number: string; icon: IconComponent; title: string; desc: string; delay: number; accent?: Accent }) {
  return (
    <Reveal delay={delay} className="relative flex-1">
      <div className="sr-card rounded-2xl border-2 sr-border-yellow sr-bg-surface p-6 h-full">
        <div className="flex items-center gap-3">
          <span className="sr-anim-badge sr-mono text-xs sr-text-muted">{number}</span>
          <div className="sr-connector h-px flex-1" />
          <div className={`sr-anim-icon inline-flex items-center justify-center h-7 w-7 rounded-lg ${accent.softClass}`}>
            <Icon className="h-3.5 w-3.5" style={{ color: accent.ring }} />
          </div>
        </div>
        <h4 className="mt-4 text-base font-semibold sr-text-main sr-display">{title}</h4>
        <p className="mt-2 text-sm sr-text-muted sr-body leading-relaxed">{desc}</p>
      </div>
    </Reveal>
  );
}

function ChecklistItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="h-5 w-5 sr-text-main shrink-0 mt-0.5" />
      <span className="text-sm sr-body sr-text-main">{children}</span>
    </li>
  );
}

/* =========================================================================
   SECTION "PREUVE" — mini tableau de bord statique enrichi
   ========================================================================= */
function ProofDashboard() {
  type StatusColor = "emerald" | "amber" | "rose";

  const campaigns: Array<{ name: string; status: string; statusColor: StatusColor }> = [
    { name: "Summer Campaign — 2026 Collection", status: "Active", statusColor: "emerald" },
    { name: "Abandoned Cart Retargeting", status: "Active", statusColor: "emerald" },
    { name: "Q3 Awareness", status: "Paused", statusColor: "amber" },
    { name: "Product Launch — New Arrival", status: "Budget error", statusColor: "rose" },
  ];

  const rules = [
    "IF ctr < 1.2% FOR 2h THEN notify_team()",
    "IF budget_remaining < 10% THEN pause_campaign()",
    "IF cpm > $22.00 THEN reduce_bid(-15%)",
  ];

  const statusStyles: Record<StatusColor, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const statusIcons: Record<StatusColor, IconComponent> = {
    emerald: CheckCircle2,
    amber: Bell,
    rose: Activity,
  };

  return (
    <div className="sr-card rounded-3xl border-2 sr-border-yellow sr-bg-surface p-6 sm:p-8" style={{ boxShadow: "0 25px 70px -25px rgba(26,26,24,0.2)" }}>
      <div className="grid md:grid-cols-2 gap-8">
        {/* statuts de campagne */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide sr-text-muted sr-body mb-3">
            Campaign statuses
          </p>
          <div className="space-y-2">
            {campaigns.map((c) => {
              const StatusIcon = statusIcons[c.statusColor];
              return (
                <div
                  key={c.name}
                  className="sr-row-anim flex items-center justify-between gap-3 rounded-xl border-2 sr-border-yellow sr-bg-soft px-4 py-3"
                >
                  <span className="flex items-center gap-2 text-sm sr-text-main sr-body truncate">
                    <StatusIcon className="sr-anim-icon h-4 w-4 shrink-0 sr-text-muted" />
                    {c.name}
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 sr-text-11 font-semibold sr-body ${statusStyles[c.statusColor]}`}
                  >
                    {c.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* règles + activité */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide sr-text-muted sr-body mb-3">
            Configured rules
          </p>
          <div className="rounded-xl border border-white/10 sr-bg-dark p-4 space-y-2">
            {rules.map((r) => (
              <p key={r} className="sr-mono sr-text-12 sr-text-yellow leading-relaxed truncate" style={{ opacity: 0.9 }}>
                {r}
              </p>
            ))}
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide sr-text-muted sr-body mt-5 mb-3">
            Recent activity
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm sr-text-main sr-body">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              Rule triggered 2 min ago
            </div>
            <div className="flex items-center gap-2 text-sm sr-text-muted sr-body">
              <BarChart3 className="h-3.5 w-3.5 shrink-0 sr-text-muted" />
              Performance report generated — 1h ago
            </div>
            <div className="flex items-center gap-2 text-sm sr-text-muted sr-body">
              <Link2 className="h-3.5 w-3.5 shrink-0 sr-text-muted" />
              Snapchat account synced — 3h ago
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   PAGE PRINCIPALE
   ========================================================================= */
export default function SnapRulesLanding() {
  const navigate = useNavigate();

  return (
    <div className="sr-theme min-h-screen sr-bg-page sr-body sr-text-main antialiased">
      <GlobalStyles />

      {/* ---------- NAV ---------- */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur"
        style={{ backgroundColor: "var(--sr-nav-bg)", borderColor: "var(--sr-border)" }}
      >

        <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg sr-bg-yellow flex items-center justify-center">
              <Zap className="h-4 w-4 sr-text-dark" />
            </span>
            <span className="sr-display font-semibold sr-text-15 tracking-tight">SnapRules</span>
          </div>
          <div className="flex items-center gap-3">
            <SecondaryButton className="px-4 py-2 sr-text-13" onClick={() => navigate('/pricing')}>
  Pricing
</SecondaryButton>
            <SecondaryButton className="px-4 py-2 sr-text-13" onClick={() => navigate('/auth/login')}>Log in</SecondaryButton>
            <PrimaryButton className="px-4 py-2 sr-text-13" onClick={() => navigate('/pricing')}>
              Get started for free
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </PrimaryButton>
          </div>
        </div>
      </header>

      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden">
        <ColorBlobs />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <Reveal>
              <Eyebrow>
                <Sparkles className="h-3.5 w-3.5" />
                Snapchat Ads Automation
              </Eyebrow>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-5 sr-display sr-text-hero font-semibold tracking-tight">
                Automate your campaigns{" "}
                <span className="relative inline-block">
                  Snapchat
                  <svg
                    className="absolute -bottom-1 left-0 w-full"
                    height="10"
                    viewBox="0 0 200 10"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d="M0,7 Q50,2 100,6 T200,5" stroke="#FFFC00" strokeWidth="6" fill="none" />
                  </svg>
                </span>{" "}
                with SnapRules
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 text-base sm:text-lg sr-text-muted leading-relaxed max-w-lg">
                Centralize your campaign management, set up smart rules,
                track your performance, and react faster.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <PrimaryButton className="px-6 py-3.5 text-sm" onClick={() => navigate('/pricing')}>
                  Get started for free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </PrimaryButton>
                <SecondaryButton className="px-6 py-3.5 text-sm" onClick={() => navigate('/auth/login')}>Log in</SecondaryButton>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sr-text-muted sr-body">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 sr-text-main" />
                  Connected to Snapchat Ads Manager
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 sr-text-main" />
                  No credit card required
                </span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={160}>
            <HeroPanel />
          </Reveal>
        </div>
      </section>

      {/* ---------- POURQUOI SNAPRULES ---------- */}
      <section className="sr-bg-soft border-y sr-border">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-20 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <Reveal>
              <Eyebrow>Why SnapRules</Eyebrow>
              <h2 className="mt-4 sr-display text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
                Running a high-performing campaign shouldn't be a full-time job.
              </h2>
              <p className="mt-4 sr-text-muted leading-relaxed">
                SnapRules simplifies managing a complex ad campaign: instead of
                constantly watching your dashboards, you set conditions, and
                the app acts on your behalf — at the right time, without manual intervention.
              </p>
            </Reveal>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-7">
              <BenefitItem
                icon={Zap}
                title="Time savings"
                desc="Less manual monitoring, more time for strategy."
                delay={0}
                accent={ACCENTS[0]}
              />
              <BenefitItem
                icon={LayoutDashboard}
                title="Better visibility"
                desc="All your campaigns and key metrics in one place."
                delay={80}
                accent={ACCENTS[2]}
              />
              <BenefitItem
                icon={SlidersHorizontal}
                title="Automation"
                desc="Conditional rules that act for you, continuously."
                delay={160}
                accent={ACCENTS[3]}
              />
              <BenefitItem
                icon={Activity}
                title="More effective tracking"
                desc="Precise alerts as soon as a metric drifts off target."
                delay={240}
                accent={ACCENTS[1]}
              />
              <BenefitItem
                icon={ShieldCheck}
                title="Fewer manual errors"
                desc="Systematic actions, applied without delay or oversight."
                delay={320}
                accent={ACCENTS[4]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CE QUE L'APPLICATION FAIT ---------- */}
      <section className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20 sm:py-24 overflow-hidden">
        <div className="pointer-events-none absolute -top-10 right-0 h-64 w-64 rounded-full" style={{ backgroundColor: "rgba(139,92,246,0.1)", filter: "blur(100px)" }} aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 -left-10 h-56 w-56 rounded-full" style={{ backgroundColor: "rgba(255,252,0,0.2)", filter: "blur(90px)" }} aria-hidden="true" />
        <Reveal className="relative max-w-2xl">
          <Eyebrow>Core features</Eyebrow>
          <h2 className="mt-4 sr-display text-3xl sm:text-4xl font-semibold tracking-tight">
            What SnapRules does for you
          </h2>
          <p className="mt-4 sr-text-muted leading-relaxed">
            From connecting your account to continuous monitoring, every step of
            campaign management is centralized in a single interface.
          </p>
        </Reveal>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            icon={Link2}
            title="Connect a Snapchat account"
            desc="Sync your Snapchat Ads Manager account in a few clicks and import your existing campaigns."
            delay={0}
            accent={ACCENTS[0]}
          />
          <FeatureCard
            icon={LayoutDashboard}
            title="Manage from a dashboard"
            desc="View and control all your campaigns from a single, clear interface."
            delay={60}
            accent={ACCENTS[2]}
          />
          <FeatureCard
            icon={SlidersHorizontal}
            title="Create automation rules"
            desc="Set custom conditions that trigger automatic actions."
            delay={120}
            accent={ACCENTS[3]}
          />
          <FeatureCard
            icon={Activity}
            title="Monitor performance and status"
            desc="Track the status of every campaign and ad set in real time."
            delay={180}
            accent={ACCENTS[1]}
          />
          <FeatureCard
            icon={Bell}
            title="Get notifications and alerts"
            desc="Get notified instantly as soon as something important happens."
            delay={240}
            accent={ACCENTS[5]}
          />
          <FeatureCard
            icon={BarChart3}
            title="Visualize key metrics"
            desc="Budget, impressions, CTR, CPM: all your essential data, readable at a glance."
            delay={300}
            accent={ACCENTS[4]}
          />
        </div>
      </section>

      {/* ---------- COMMENT ÇA MARCHE ---------- */}
      <section className="sr-bg-soft border-y sr-border">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-20 sm:py-24">
          <Reveal className="max-w-2xl">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 sr-display text-3xl sm:text-4xl font-semibold tracking-tight">
              Three steps to automate everything
            </h2>
          </Reveal>

          <div className="mt-12 flex flex-col md:flex-row gap-5">
            <StepCard
              number="01"
              icon={Link2}
              title="Connect your Snapchat account"
              desc="Authorize access to your Ads Manager account to import your campaigns."
              delay={0}
              accent={ACCENTS[2]}
            />
            <StepCard
              number="02"
              icon={SlidersHorizontal}
              title="Define your rules and conditions"
              desc="Configure the thresholds and actions to trigger automatically."
              delay={100}
              accent={ACCENTS[3]}
            />
            <StepCard
              number="03"
              icon={Zap}
              title="Let SnapRules automate"
              desc="The app monitors and acts continuously, even while you're away."
              delay={200}
              accent={ACCENTS[0]}
            />
          </div>
        </div>
      </section>

      {/* ---------- FONCTIONNALITÉS CLÉS DÉTAILLÉES ---------- */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-20 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <Eyebrow>Key features</Eyebrow>
            <h2 className="mt-4 sr-display text-3xl sm:text-4xl font-semibold tracking-tight">
              Built for demanding marketing teams
            </h2>
            <ul className="mt-7 grid sm:grid-cols-1 gap-4">
              <ChecklistItem>Automated campaign actions</ChecklistItem>
              <ChecklistItem>Real-time tracking dashboards</ChecklistItem>
              <ChecklistItem>Customizable conditional rules</ChecklistItem>
              <ChecklistItem>Complete execution history</ChecklistItem>
              <ChecklistItem>Smart, targeted notifications</ChecklistItem>
              <ChecklistItem>Simple, fast interface for the whole team</ChecklistItem>
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <ProofDashboard />
          </Reveal>
        </div>
      </section>

      {/* ---------- CTA FINAL ---------- */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 pb-20 sm:pb-28">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-3xl px-8 py-14 sm:px-16 sm:py-20 text-center"
            style={{ background: "linear-gradient(135deg, #FFFC00 0%, #FFE45C 100%)" }}
          >
            <div className="pointer-events-none absolute -top-16 -left-10 h-64 w-64 rounded-full" style={{ backgroundColor: "rgba(139,92,246,0.2)", filter: "blur(100px)" }} aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-16 right-0 h-72 w-72 rounded-full" style={{ backgroundColor: "rgba(255,107,74,0.25)", filter: "blur(110px)" }} aria-hidden="true" />
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-56 w-56 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.3)", filter: "blur(100px)" }} aria-hidden="true" />
            <div
              className="pointer-events-none absolute inset-y-0 w-1/3 sr-sweep"
              style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)" }}
              aria-hidden="true"
            />
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sr-text-dark sr-body" style={{ borderColor: "rgba(26,26,24,0.15)", backgroundColor: "rgba(255,255,255,0.7)" }}>
              <Sparkles className="h-3.5 w-3.5" />
              Ready in under 5 minutes
            </span>
            <h2 className="mt-5 sr-display sr-text-cta font-semibold sr-text-dark tracking-tight leading-tight">
              Ready to automate your campaigns?
            </h2>
            <p className="mt-4 max-w-xl mx-auto leading-relaxed" style={{ color: "rgba(26,26,24,0.7)" }}>
              Join the teams who let SnapRules monitor their performance
              while they focus on strategy.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/pricing')}
                className="group inline-flex items-center justify-center gap-2 rounded-xl sr-bg-dark px-7 py-3.5 text-sm font-semibold text-white sr-body transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
              >
                Create an account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => navigate('/auth/login')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-7 py-3.5 text-sm font-semibold sr-text-dark sr-body transition-all duration-200 hover:bg-white/40"
                style={{ borderColor: "rgba(26,26,24,0.25)" }}
              >
                Log in
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t sr-border">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-md sr-bg-yellow flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 sr-text-dark" />
            </span>
            <span className="sr-display font-semibold text-sm">SnapRules</span>
          </div>
          <p className="text-xs sr-text-muted sr-body">
            © {new Date().getFullYear()} SnapRules. Snapchat campaign automation.
          </p>
        </div>
      </footer>
    </div>
  );
}