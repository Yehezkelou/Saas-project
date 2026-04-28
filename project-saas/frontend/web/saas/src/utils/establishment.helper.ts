// src/utils/establishment.helper.ts

export type BusinessType = 'RESTAURANT' | 'BAR' | 'CAFE' | 'FASTFOOD';

export interface StepLabels {
  toPrepare: string;
  inProgress: string;
  ready: string;
  finished: string;
  tablesView: string;
  establishmentName: string;
}

export function getEstablishmentLabels(businessType: string): StepLabels {
  const type = (businessType || 'RESTAURANT') as BusinessType;

  const config: Record<BusinessType, StepLabels> = {
    RESTAURANT: {
      toPrepare: "À cuisiner",
      inProgress: "En cuisine",
      ready: "À servir",
      finished: "Payé",
      tablesView: "Tables",
      establishmentName: "Cuisine"
    },
    BAR: {
      toPrepare: "Commandes",
      inProgress: "Au Bar",
      ready: "Prêt",
      finished: "Payé",
      tablesView: "Tables",
      establishmentName: "Bar"
    },
    CAFE: {
      toPrepare: "À préparer",
      inProgress: "Comptoir",
      ready: "Servi",
      finished: "Payé",
      tablesView: "Tables",
      establishmentName: "Comptoir"
    },
    FASTFOOD: {
      toPrepare: "Bornes / Caisse",
      inProgress: "Préparation",
      ready: "Prêt",
      finished: "Payé",
      tablesView: "Tables",
      establishmentName: "Préparation"
    }
  };

  return config[type] || config.RESTAURANT;
}
