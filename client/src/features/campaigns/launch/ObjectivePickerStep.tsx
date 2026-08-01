import { useState } from 'react';
import { X, ShoppingCart, Globe, Smartphone, Users, Megaphone, ArrowRight } from 'lucide-react';
import type { CampaignTemplate } from './launch.types';

export type ObjectiveValue = CampaignTemplate['objectiveV2Type'];

interface Objective {
  value: ObjectiveValue;
  label: string;
  description: string;
  icon: React.ReactNode;
  emoji: string;
}

const OBJECTIVES: Objective[] = [
  {
    value: 'SALES',
    label: 'Sales',
    description: 'Drive purchases, sign-ups, and online conversions with pixel tracking.',
    icon: <ShoppingCart className="h-6 w-6" />,
    emoji: '🛒',
  },
  {
    value: 'TRAFFIC',
    label: 'Traffic',
    description: 'Send people to your website, landing page, or app store listing.',
    icon: <Globe className="h-6 w-6" />,
    emoji: '🌐',
  },
  {
    value: 'APP_PROMOTION',
    label: 'App Promotion',
    description: 'Increase app installs and re-engagement across Snapchat placements.',
    icon: <Smartphone className="h-6 w-6" />,
    emoji: '📱',
  },
  {
    value: 'LEADS',
    label: 'Lead Generation',
    description: 'Collect contact info from prospects directly inside Snapchat.',
    icon: <Users className="h-6 w-6" />,
    emoji: '📋',
  },
  {
    value: 'AWARENESS_AND_ENGAGEMENT',
    label: 'Awareness & Engagement',
    description: 'Reach a wide audience and build your brand with maximum impressions.',
    icon: <Megaphone className="h-6 w-6" />,
    emoji: '📣',
  },
];

interface Props {
  onClose: () => void;
  onContinue: (objective: ObjectiveValue) => void;
}

export default function ObjectivePickerStep({ onClose, onContinue }: Props) {
  const [selected, setSelected] = useState<ObjectiveValue | null>(null);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center rounded-full bg-snap-yellow/20 px-2.5 py-0.5 text-[11px] font-semibold text-yellow-700 tracking-wide">
              Step 1 of 2
            </span>
          </div>
          <h2 className="text-2xl font-bold text-snap-ink leading-tight">
            Choose your campaign objective
          </h2>
          <p className="mt-1.5 text-sm text-snap-muted">
            Select the goal that best describes what you want to achieve
          </p>
        </div>
        <button
          id="wizard-close-btn"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-snap-border text-snap-muted hover:text-snap-ink hover:border-snap-muted transition-all ml-4"
          aria-label="Close wizard"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Objective cards grid */}
      <div className="flex-1 overflow-y-auto pr-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 content-start">
        {OBJECTIVES.map((obj) => {
          const isSelected = selected === obj.value;
          return (
            <button
              key={obj.value}
              id={`objective-card-${obj.value.toLowerCase()}`}
              type="button"
              onClick={() => setSelected(obj.value)}
              className={[
                'group flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-all duration-200',
                'hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-snap-yellow',
                isSelected
                  ? 'border-snap-yellow bg-snap-yellow/8 shadow-md -translate-y-1'
                  : 'border-snap-border bg-snap-soft hover:border-snap-muted',
              ].join(' ')}
            >
              {/* Icon */}
              <div
                className={[
                  'flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-200',
                  isSelected
                    ? 'bg-snap-yellow text-snap-ink'
                    : 'bg-snap-card border border-snap-border text-snap-muted group-hover:text-snap-ink',
                ].join(' ')}
              >
                {obj.icon}
              </div>

              {/* Text */}
              <div className="flex-1">
                <p className="text-sm font-semibold text-snap-ink">{obj.label}</p>
                <p className="mt-1 text-xs text-snap-muted leading-relaxed">{obj.description}</p>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="self-end flex items-center gap-1 rounded-lg bg-snap-yellow px-2 py-0.5 text-[10px] font-bold text-snap-ink">
                  Selected ✓
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between pt-5 border-t border-snap-border">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-snap-border px-5 py-2.5 text-sm text-snap-muted hover:text-snap-ink transition-all"
        >
          Cancel
        </button>
        <button
          id="wizard-continue-btn"
          type="button"
          disabled={!selected}
          onClick={() => selected && onContinue(selected)}
          className={[
            'flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-200',
            selected
              ? 'bg-snap-yellow text-snap-ink hover:brightness-105 hover:-translate-y-0.5 shadow-md hover:shadow-lg'
              : 'bg-snap-soft text-snap-muted cursor-not-allowed',
          ].join(' ')}
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
