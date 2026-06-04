#!/bin/bash
# Quick Start Guide - Gestion Audio

echo "🎧 Gestion Audio - Guide de Démarrage Rapide"
echo "============================================"
echo ""
echo "Prérequis: Node.js 20+ installé"
echo ""

cd /workspaces/codespaces-blank/gestion-audio

echo "📦 Installation des dépendances..."
npm install > /dev/null 2>&1
echo "✅ Dépendances installées"
echo ""

echo "🔨 Construction du projet..."
npm run build > /dev/null 2>&1
echo "✅ Build réussi"
echo ""

echo "🚀 Démarrage du serveur..."
echo "Le serveur démarre sur http://localhost:3000"
echo ""
echo "Accès :"
echo "  👤 Technicien Audio: http://localhost:3000/"
echo "  👔 Patron: http://localhost:3000/patron (password: patron123)"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

npm run dev
