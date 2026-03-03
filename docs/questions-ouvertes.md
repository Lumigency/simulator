# Questions ouvertes - Simulateur Lumigency

## 1. Budget floor (10 000 EUR) et calcul du ROI

**Contexte :** Quand le budget reel consomme (`finalOrders x cacClient`) est inferieur a 5 000 EUR, on affiche un budget minimum de 10 000 EUR (couts plateformes & agence).

**Question :** Le ROI doit etre calcule sur quel montant ?

| Option | Formule | Effet |
|--------|---------|-------|
| A - Budget reel consomme | `ROI = revenue / budgetConsumed` | ROI plus eleve, reflete le retour pur sur le CPA |
| B - Budget affiche (10 000 EUR) | `ROI = revenue / budgetDisplayed` | ROI plus bas, reflete le cout reel total du programme (frais plateforme + agence inclus) |

**Implementation actuelle :** Option A (ROI base sur `budgetConsumed`).

**Tests concernes :** Test 3 (budget=2909, affiche=10000), Test 4 (budget=958, affiche=10000), Test 7 (budget=714, affiche=10000).

**Statut :** En attente de validation cliente.
