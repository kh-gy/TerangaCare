"""Peuplement de données de démonstration.

Usage (depuis le dossier backend/) :
    DATABASE_URL="sqlite:///./teranga.db" python -m app.seed

Idempotent : ne recrée pas les utilisateurs déjà présents (basé sur l'email).
Comptes créés (mot de passe : password123) :
    - Patient : patient@terangacare.sn
    - Médecin : a.diallo@terangacare.sn
En mode développement (APP_ENV != production), l'authentification est de toute
façon désactivée et l'API résout un utilisateur de démonstration.
"""

import json
from datetime import datetime, timezone, timedelta

from app.database import SessionLocal, init_db
from app.models import Medecin, Patient, CarnetSante, RendezVous
from app.security import hash_password

MEDECINS = [
    dict(prenom="Aminata", nom="Diallo", email="a.diallo@terangacare.sn", localisation="Dakar, Plateau", tarif=10000, note=4.8),
    dict(prenom="Ibrahima", nom="Sow", email="i.sow@terangacare.sn", localisation="Dakar, Almadies", tarif=25000, note=4.9),
    dict(prenom="Fatou", nom="Ndoye", email="f.ndoye@terangacare.sn", localisation="Thiès", tarif=15000, note=4.7),
    dict(prenom="Ousmane", nom="Ba", email="o.ba@terangacare.sn", localisation="Dakar, Mermoz", tarif=20000, note=4.6),
    dict(prenom="Mariama", nom="Cissé", email="m.cisse@terangacare.sn", localisation="Saint-Louis", tarif=18000, note=4.9),
]


def run():
    init_db()
    db = SessionLocal()
    try:
        for i, m in enumerate(MEDECINS):
            if db.query(Medecin).filter(Medecin.email == m["email"]).first():
                continue
            db.add(Medecin(
                prenom=m["prenom"], nom=m["nom"], email=m["email"],
                mot_de_passe=hash_password("password123"), role="medecin",
                numero_ordre=f"ORD-{i:03d}", localisation=m["localisation"],
                tarif_consultation=m["tarif"], note_moyenne=m["note"], disponibilite=True,
            ))

        patient = db.query(Patient).filter(Patient.email == "patient@terangacare.sn").first()
        if not patient:
            patient = Patient(
                prenom="Moussa", nom="Sarr", email="patient@terangacare.sn",
                mot_de_passe=hash_password("password123"), role="patient",
                adresse="Sicap Liberté 6, Dakar",
            )
            db.add(patient)

        db.flush()

        if not patient.carnet_sante:
            db.add(CarnetSante(
                patient_id=patient.id,
                groupe_sanguin="O+",
                allergies=json.dumps(["Pénicilline", "Arachides"], ensure_ascii=False),
                maladies_chroniques=json.dumps(["Hypertension artérielle"], ensure_ascii=False),
                antecedents=json.dumps(["Appendicectomie (2018)"], ensure_ascii=False),
            ))

        premier_medecin = db.query(Medecin).order_by(Medecin.id.asc()).first()
        if premier_medecin and not db.query(RendezVous).filter(RendezVous.patient_id == patient.id).first():
            now = datetime.now(timezone.utc)
            db.add_all([
                RendezVous(date_heure=now + timedelta(days=2, hours=10), statut="EN_ATTENTE",
                           motif="Consultation de routine", patient_id=patient.id, medecin_id=premier_medecin.id),
                RendezVous(date_heure=now + timedelta(days=4, hours=14), statut="EN_ATTENTE",
                           motif="Douleurs abdominales", patient_id=patient.id, medecin_id=premier_medecin.id),
            ])

        db.commit()
        print("Seed terminé.")
        print(f"  Médecins : {db.query(Medecin).count()} | Patients : {db.query(Patient).count()} | RDV : {db.query(RendezVous).count()}")
        print("  Comptes démo (password123) : patient@terangacare.sn / a.diallo@terangacare.sn")
    finally:
        db.close()


if __name__ == "__main__":
    run()
