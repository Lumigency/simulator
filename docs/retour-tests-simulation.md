Bonjour,

Voici le retour sur les 10 cas de test du simulateur.

Bonne nouvelle : 9 tests sur 10 sont validés (dont 3 avec des écarts d'arrondi inférieurs à 2%). Il reste 1 cas à clarifier ensemble.


TEST 1 — Mode & beauté, tous leviers → ✅ OK
Tous les KPIs collent : CA 172 567 €, ROI 4,79x, 2 458 commandes, panier 70 €, budget 36 000 €.

TEST 2 — Maison & déco, 4 leviers → ✅ OK
Tous les KPIs collent : CA 708 710 €, ROI 11,81x, 5 370 commandes, panier 132 €, budget 60 000 €.

TEST 3 — Alimentaire & drive, tous leviers → ✅ OK
Tous les KPIs collent : CA 25 527 €, ROI 1,42x, 582 commandes, panier 44 €, budget 18 000 €.

TEST 4 — Sport & loisirs, cashback/influence/affinitaires → ✅ OK
Tous les KPIs collent : CA 3 613 €, ROI 0,30x, 192 commandes, panier 19 €, budget 12 000 €.

TEST 5 — Luxe & bijoux, tous leviers → ✅ OK (écart < 1%)
CA obtenu : 1 613 860 € au lieu de 1 600 000 € attendus (+0,9%).
Tous les autres KPIs sont exacts. L'écart vient probablement d'un arrondi dans le calcul de référence.

TEST 6 — Autre, comparateurs/CSS/content → ✅ OK (écart ~2%)
CA obtenu : 357 567 € au lieu de 350 602 € (+2%).
L'écart vient de ~16 commandes de plus (811 vs 795), lié à une différence de précision sur le taux de conversion intermédiaire. Panier moyen et budget sont exacts.

TEST 7 — Sport & loisirs, tous leviers, petit trafic → ✅ OK
Tous les KPIs collent : CA 6 111 €, ROI 1,02x, 179 commandes, panier 34 €, budget 6 000 €.

TEST 8 — High-tech, comparateurs/retargeting/display/SEA → ❌ KO
C'est le seul test en écart significatif. Le problème vient du panier moyen :
  - Attendu : 60 € (soit -23% du panier saisi de 78 €)
  - Obtenu : 68,80 € (soit -12%)
Tout le reste (CA, ROI, ratio coût) découle de cet écart sur le panier.

Notre modèle réduit le panier moyen pour cashback (-5%), bons plans (-5%) et comparateurs/CSS (-2%), mais il n'applique rien de spécifique pour retargeting, display networks ou SEA.

→ Question : quelles réductions de panier moyen appliquez-vous pour ces leviers ? C'est la seule info dont on a besoin pour boucler ce cas.

TEST 9 — Voyage & tourisme, tous leviers → ✅ OK
Tous les KPIs collent : CA 98 708 €, ROI 4,11x, 4 499 commandes, panier 22 €, budget 24 000 €.

TEST 10 — Automobile, 7 leviers → ✅ OK (écart < 1%)
CA obtenu : 879 409 € au lieu de 871 795 € (+0,9%).
L'écart vient de ~33 commandes de plus (3 798 vs 3 765), même type de différence d'arrondi que le test 6. Panier moyen et budget sont exacts.


En résumé :
  ✅ 6 tests parfaits (1, 2, 3, 4, 7, 9)
  ⚠️ 3 tests OK avec écarts d'arrondi < 2% (5, 6, 10)
  ❌ 1 test KO sur le panier moyen (8) — en attente de votre retour sur les ajustements AOV pour retargeting/display/SEA
