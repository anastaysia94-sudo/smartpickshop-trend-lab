export type OpportunityInput={id:string;name:string;demand:number;competition:number;urgency:number;monetization:number;evidence:string};
export function scoreOpportunity(x:Pick<OpportunityInput,"demand"|"competition"|"urgency"|"monetization">){
  return Math.round(0.35*x.demand+0.15*(100-x.competition)+0.25*x.urgency+0.25*x.monetization);
}
export function strongestInput(x:OpportunityInput){
  const values=[["Demand",x.demand],["Competition advantage",100-x.competition],["Urgency",x.urgency],["Monetization",x.monetization]] as const;
  return [...values].sort((a,b)=>b[1]-a[1])[0][0];
}
