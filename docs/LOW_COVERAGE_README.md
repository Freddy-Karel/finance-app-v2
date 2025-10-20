# Cron / Vérification automatique — Low Coverage

Ce document explique comment configurer et tester la vérification automatique des enveloppes à faible couverture (`LOW_COVERAGE`).

Principe
- Une API interne protègée (`POST /api/_internal/runLowCoverage`) vérifie la couverture des enveloppes (sur 90 jours) et crée des anomalies pour celles en dessous d'un seuil (2 mois par défaut).
- Un workflow GitHub Actions appelle cette API quotidiennement.

Variables / Secrets GitHub
- `APP_URL` : URL publique de ton application (ex. `https://app.example.com`).
- `JOB_SECRET` : chaîne secrète partagée utilisée pour sécuriser l'appel à l'API.

Configurer les secrets
1. Ouvre ton dépôt GitHub → Settings → Secrets and variables → Actions → New repository secret.
2. Ajoute `APP_URL` et `JOB_SECRET`.

Tester localement
1. Dans ton environnement local, définis la variable d'environnement `JOB_SECRET` (même valeur que dans GitHub) et démarre l'app :

```bash
export JOB_SECRET="ma-valeur-secrete"
pnpm dev
```

2. Dans un autre terminal, lance le script npm qui appelle l'API :

```bash
pnpm run run:low-coverage
```

Le script envoie une requête POST vers `http://localhost:3000/api/_internal/runLowCoverage` avec l'en-tête `x-job-secret`.

Appel direct (curl)
```bash
curl -X POST "$APP_URL/api/_internal/runLowCoverage" -H "x-job-secret: $JOB_SECRET"
```

Notes sécurité
- Ne publie jamais `JOB_SECRET` dans le code ni dans des logs publics.
- En production, protège l'URL (HTTPS) et limite les adresses IP si possible.

Workflow GitHub Actions
- Fichier ajouté : `.github/workflows/cron_low_coverage.yml` (exécution quotidienne à 04:00 UTC).
- Le workflow utilise `APP_URL` et `JOB_SECRET` depuis les secrets.

Observabilité
- Les anomalies créées apparaissent dans la page `Anomalies` de l'application (filtres `open`).
- Le workflow logpera la réponse JSON dans les logs Actions.

Questions fréquentes
- Que faire si le workflow échoue ?
  - Vérifie `APP_URL` et `JOB_SECRET`.
  - Exécute `pnpm run run:low-coverage` localement pour reproduire.

Support
- Si tu veux que je fournisse un workflow différent (p.ex. exécution hebdomadaire ou notifications Slack), dis‑le et je l'ajoute.




