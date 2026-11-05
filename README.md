# Lettre au Père Noël

La lettre commune de la famille : Cédric et Aurélia ajoutent chacun leurs idées de jouets depuis leur téléphone, tout arrive en direct sur une seule lettre.

Site : https://cedriccovarel92.github.io/lettre-pere-noel/

## Comment ça marche
- Connexion Google, réservée aux deux adresses de `firebase-config.js`.
- On ajoute un jouet en envoyant une **capture d'écran** de sa page produit : Gemini (Firebase AI Logic) lit le nom et recadre la photo du produit.
- Export PDF, image à partager, liste avec les liens.

## Réglages Firebase (projet jojo-cooker, déjà utilisé par Jojo cooker)
1. **Règles Firestore** : ajouter le bloc de `firestore-rules-a-ajouter.txt`, puis Publier.
2. **Firebase AI Logic** : console Firebase → AI Logic → Commencer → « Gemini Developer API » (gratuit). Sans cela, les captures sont collées entières et le nom est à écrire à la main.
3. Domaine `cedriccovarel92.github.io` : déjà autorisé pour Jojo cooker, rien à faire.

## Données
Firestore : `noel/lettre` (texte, signature, âge) et `noel/lettre/jouets/{id}` (nom, photo, lien, qui l'a ajouté).
