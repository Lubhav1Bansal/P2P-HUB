# 🌐 P2P HUB

**P2P HUB** is a modern, anonymous social platform designed to connect people entirely through their interests, skills, and ideas. By stripping away real-world identities and replacing them with auto-generated "Agent Personas," P2P HUB eliminates identity bias and fosters genuine connections around technology, arts, business, and more.

## ✨ Features

- 🕵️ **Anonymous Identity Generation:** Users securely sign in via Google, but never expose their real names. The system mints unique hacker-style aliases (e.g., *Cyber Ninja 402*) upon entry.
- 🎯 **Niche Sub-Communities (Hubs):** Users can join highly specific hubs spanning a variety of sectors including AI & Data Science, Startups, Gaming, Design, and Public Speaking.
- 💬 **Peer-To-Peer Direct Messaging:** An encrypted, Discord-style 1-to-1 messaging system allowing users to connect and chat privately directly from someone's profile.
- 🏆 **Reputation (REP) System:** A specialized ranking system where users earn "REP" by receiving likes on their codebase drops, insights, and anonymous community profiles.
- 📸 **Live Image Routing:** Seamless image dropping and post attachment powered by ImgBB.
- 🎨 **Sage Dark-Mode UI:** A high-contrast, brutalist-inspired UI designed for late-night builders and developers. 

## 🛠️ Tech Stack

- **Frontend:** React, Vite, CSS (Vanilla Custom Properties & Variables)
- **Backend & Database:** Firebase Auth, Cloud Firestore (NoSQL)
- **Media Hosting:** ImgBB API
- **Icons:** Lucide-React

## 🚀 Getting Started

If you want to run this application locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/p2p-hub.git
   cd p2p-hub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   - Head over to the [Firebase Console](https://console.firebase.google.com/) and create a project.
   - Enable Google Authentication and Firestore Database (set rules to test mode).
   - Update your `src/firebase.js` file with your config keys.

4. **Start the local development server:**
   ```bash
   npm run dev
   ```

## 📜 The Pact
Users on P2P HUB agree to an overarching Code of Conduct ("The Pact") prior to registering—ensuring that while identities are hidden, the ecosystem remains respectful, anti-spam, and protected by human moderation systems.
