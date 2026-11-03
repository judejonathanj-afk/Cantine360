import { Hero } from '@/components/home/hero';
import { HowItWorks } from '@/components/home/how-it-works';

export function HomeIntro() {
  return (
    <div className="relative">
      <Hero />
      <HowItWorks />
    </div>
  );
}
