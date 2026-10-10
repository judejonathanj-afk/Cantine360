# Cantine Guard sur VPS (cron systemd)

Surveillance **toutes les 30 minutes** : page login + `/api/cantine-guard/health` (Postgres via Vercel).

## 1. Vercel

Ajouter une variable d’environnement **Production** :

- `CANTINE_GUARD_SECRET` — au moins **16 caractères** aléatoires (même valeur que sur le VPS).

Redéployer après ajout.

## 2. VPS (Hetzner / OVH, Ubuntu 22.04+)

Prérequis : **Node 20+** (`node -v`).

```bash
sudo useradd --system --home /var/lib/cantine-guard --shell /usr/sbin/nologin cantine-guard
sudo mkdir -p /etc/cantine-guard /var/lib/cantine-guard /opt/cantine-guard
sudo chown cantine-guard:cantine-guard /var/lib/cantine-guard
```

Cloner ou rsync le repo (au minimum `scripts/cantine-guard-run.mjs`) :

```bash
sudo rsync -av scripts/cantine-guard-run.mjs /opt/cantine-guard/scripts/
sudo chown -R root:root /opt/cantine-guard
```

Configurer les secrets :

```bash
sudo cp ops/cantine-guard/cantine-guard.env.example /etc/cantine-guard/env
sudo chmod 600 /etc/cantine-guard/env
sudo nano /etc/cantine-guard/env
```

Installer systemd :

```bash
sudo cp ops/cantine-guard/cantine-guard.service /etc/systemd/system/
sudo cp ops/cantine-guard/cantine-guard.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cantine-guard.timer
```

Test manuel :

```bash
sudo systemctl start cantine-guard.service
sudo systemctl status cantine-guard.service
journalctl -u cantine-guard.service -n 30 --no-pager
cat /var/lib/cantine-guard/last-report.json
```

Prochaines exécutions :

```bash
systemctl list-timers cantine-guard.timer
```

## 3. Fuseau horaire

Le timer définit `Timezone=Europe/Paris` : les passages sont à **:00 et :30 heure de Paris** (y compris heure d’été/hiver). Sur un VPS très ancien (systemd &lt; 249), installer une version récente ou régler `timedatectl set-timezone Europe/Paris`.

## 4. Évolutions

- Webhook Sentry → petite route sur le VPS (Caddy + script) ou Vercel.
- Sondes métier lourdes : garder `diagnostic-e2e.mjs` en **manuel** ou cron hebdo, pas toutes les 30 min.
