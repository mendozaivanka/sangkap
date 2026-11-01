# Licences and attribution

| Source | Used for | Licence | Republished raw? |
| --- | --- | --- | --- |
| PubChem PUG REST (NCBI) | properties and 2D layouts of 5 compounds | NCBI data policy: no restrictions on PubChem computed data (depositor rights may apply to deposited records; only computed properties and PubChem's own depictions are used) | Yes, `pipeline/pubchem/snapshot/` |
| USDA FoodData Central, SR Legacy (2019) | caffeine per 100 g, 4 foods | CC0 1.0 | Yes, `pipeline/fdc/snapshot/foods.json` |
| EFSA NDA Panel 2015, EFSA Journal 13(5):4102 | 8 figures | © EFSA 2015; indexed (OpenAlex, SHERPA) as open access CC BY-ND 4.0, not printed on the PDF | No: single values, cited |
| EFSA, "Caffeine: EFSA explains risk assessment" (2015) | 2 serving sizes | © EFSA 2015, reproduction authorised except for commercial purposes, source acknowledged | No |
| Poole et al. 2017, BMJ 359:j5024 | 6 associations | CC BY-NC 4.0 | No: single values, cited |
| Farah & Donangelo 2006, Braz J Plant Physiol 18(1) | 5 figures (chlorogenic acids) | CC BY-NC 4.0 (SciELO) | No |
| Maier et al. 2025, Molecules 30:2951 | 7 figures (cafestol, kahweol) | CC BY 4.0 | No |
| Fuller & Rao 2017, Sci Rep 7:17979 | 2 figures (caffeine, French press and cold brew) | CC BY 4.0 | No |
| Peng et al. 2025, Front Nutr 12:1690881 | 3 figures | CC BY 4.0 | No |
| Perrois et al. 2015, Planta 241:179 | 1 figure | CC BY (version not stated) | No |
| Kurniawan et al. 2026, Molecules 31:1518 | 1 figure | CC BY 4.0 | No |
| Socała et al. 2021, Int J Mol Sci 22:107 | 2 figures | CC BY 4.0 | No |
| `pipeline/curated/*.psv` | Sangkap's transcriptions | CC BY 4.0 (Sangkap) | Yes |

Facts are cited one value at a time with the source, its locator and its words; no table, figure or text passage is
mirrored, which keeps the CC BY-NC and © sources out of the redistribution question. Read models in each release are
CC BY 4.0; anyone reusing them should keep each figure's source (it is in `figures.json` and `sources.json`).

Not used: Phenol-Explorer (non-commercial terms), ChEMBL (CC BY-SA 3.0; if added later, keep it in a separate file
marked share-alike in the manifest and on the page), FooDB, DrugBank (CC BY-NC), Google or Foursquare data.
