import { useState, useEffect, useCallback } from 'react';
import ObjectivePickerStep, { type ObjectiveValue } from './ObjectivePickerStep';
import CampaignFormStep from './CampaignFormStep';

interface Props {
  onClose: () => void;
}

type Step = 1 | 2;
type Direction = 'forward' | 'back';

export default function LaunchCampaignWizard({ onClose }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<Direction>('forward');
  const [objective, setObjective] = useState<ObjectiveValue | null>(null);
  const [stepKey, setStepKey] = useState(0); // forces re-mount to re-trigger animation

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const goToStep2 = (obj: ObjectiveValue) => {
    setObjective(obj);
    setDirection('forward');
    setStepKey((k) => k + 1);
    setStep(2);
  };

  const goBack = () => {
    setDirection('back');
    setStepKey((k) => k + 1);
    setStep(1);
  };

  const animClass = direction === 'forward' ? 'wizard-step-in' : 'wizard-step-back';

  return (
    /* Backdrop */
    <div
      className="wizard-backdrop-in fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: 'rgba(26,26,24,0.18)', backdropFilter: 'blur(4px)' }}
    >
      {/* Click-outside to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal card */}
      <div
        className={[
          'wizard-card-in relative z-10 flex flex-col w-full bg-snap-card',
          'rounded-3xl border border-snap-border shadow-2xl',
          // Step 1: narrower card; Step 2: wider to fit the form
          step === 1
            ? 'max-w-2xl'
            : 'max-w-4xl',
          // Height: tall enough for content, scrollable inside
          'max-h-[92vh]',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={step === 1 ? 'Choose campaign objective' : 'Configure campaign'}
      >
        {/* Decorative top accent bar */}
        <div className="h-1 w-full rounded-t-3xl bg-gradient-to-r from-snap-yellow via-yellow-300 to-snap-yellow opacity-70" />

        {/* Inner padding wrapper */}
        <div className="flex flex-col flex-1 overflow-hidden p-6 sm:p-8 min-h-0">
          {/* Animated step content */}
          <div key={stepKey} className={`${animClass} flex flex-col flex-1 min-h-0`}>
            {step === 1 ? (
              <ObjectivePickerStep
                onClose={onClose}
                onContinue={goToStep2}
              />
            ) : objective ? (
              <CampaignFormStep
                objective={objective}
                onBack={goBack}
                onClose={onClose}
                onLaunched={onClose}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
