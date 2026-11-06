import { Check, Users, Download, FileSpreadsheet, ChevronRight } from 'lucide-react';

export function FeaturePreview({ variant }: { variant: string }) {
  if (variant === 'menu') return <div className="w-full overflow-visible md:scale-[1.08] md:origin-center"><img src="/marketing/menu-plats.png" alt="Fiche plat : intitulé, grammage, allergènes et régimes" className="w-full origin-center object-contain object-center" /></div>;
  if (variant === 'service') return <div className="w-full max-w-[680px] overflow-hidden rounded-[22px] shadow-[0_18px_40px_rgba(18,48,36,0.12)]"><img src="/marketing/fiche-service.png" alt="Fiche service cuisine : repas servis et pesée des déchets maternelle et primaire" className="w-full origin-center object-contain object-center transition-transform duration-500 ease-out hover:scale-[1.055]" /></div>;
  if (variant === 'dashboard') return (
    <div className="flex w-full flex-col gap-3">
      <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_12px_28px_rgba(18,48,36,0.10)]">
        <img
          src="/marketing/cantine360-dashboard-admin-kpis.png"
          alt="Tableau de bord admin Cantine+ : bienvenue, filtres et indicateurs présents, assiettes servies, RAB, refus et déchets"
          className="h-auto w-full object-contain object-top"
        />
      </div>
      <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_12px_28px_rgba(18,48,36,0.10)]">
        <img
          src="/marketing/cantine360-tendances-antigaspillage.png"
          alt="Tendances Antigaspillage Cantine+ : indicateur de déchets g / 100 assiettes et graphique maternelle / primaire"
          className="h-auto w-full object-contain object-top"
        />
      </div>
    </div>
  );
  if (variant === 'students') return <div className="paper-panel w-full p-6 sm:p-7"><div className="flex items-center justify-between"><h4 className="flex items-center gap-2 text-[13px] font-bold"><Users size={17} className="text-[var(--blue)]" /> Élèves & classes</h4><span className="rounded-md border border-border px-2 py-1 text-[9px] text-muted-foreground">Import CSV</span></div><p className="mt-3 text-[10px] text-muted-foreground">Une organisation par classe, des informations à jour.</p><div className="mt-5 grid grid-cols-[1fr_1fr_1fr] border-b border-border pb-3 text-[9px] text-muted-foreground"><span>Élève</span><span>Classe</span><span>Information</span></div>{[['Élève A', 'Grande section', 'Lait'], ['Élève B', 'CP', 'Sans porc'], ['Élève C', 'CE1', 'Aucune déclarée'], ['Élève D', 'CM2', 'Œufs']].map(([name, school, info], i) => <div key={name} className="grid grid-cols-[1fr_1fr_1fr] items-center border-b border-border py-4 text-[10px]"><span className="font-semibold">{name}</span><span className="text-muted-foreground">{school}</span><span className={`w-fit rounded-md px-2 py-1 text-[8px] ${i === 0 || i === 3 ? 'bg-[#fff4d7] text-[#8b6b20]' : 'bg-secondary text-muted-foreground'}`}>{info}</span></div>)}<p className="mt-4 flex items-center gap-2 text-[9px] text-[var(--blue)]"><Check size={13} /> Des repères utiles pour préparer le service</p><p className="mt-3 text-[8px] text-muted-foreground">Aperçu illustratif · aucun élève réel</p></div>;
  return <div className="paper-panel w-full p-6 sm:p-7"><div className="flex items-center gap-2 text-[13px] font-bold"><FileSpreadsheet size={18} className="text-primary" /> Vos données, prêtes à partager</div><p className="mt-2 text-[10px] text-muted-foreground">Préparez le bilan de votre restauration scolaire.</p><div className="my-6 rounded-xl border border-dashed border-[#c4dacb] bg-[#f7fbf8] p-6 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white text-primary"><FileSpreadsheet size={28} strokeWidth={1.6} /></span><p className="mt-3 text-[12px] font-semibold">bilan-cantine-exemple.csv</p><p className="mt-2 text-[9px] text-muted-foreground">Repas · déchets · période · niveaux</p></div>{['Suivi des services', 'Pesées maternelle / primaire', 'Indicateurs par période'].map(text => <div key={text} className="flex items-center justify-between border-t border-border py-3 text-[10px]"><span className="flex items-center gap-2"><Check size={12} className="text-primary" /> {text}</span><ChevronRight size={12} className="text-muted-foreground" /></div>)}<div className="mt-3 flex items-center gap-2 text-[9px] text-primary"><Download size={13} /> Testez le CSV exemple dans l’aperçu en haut de page</div></div>;
}
