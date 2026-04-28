<div align="center">

<br />

# Reclaim

**Lost & Found — Made Easy for Campus**

A centralized web platform where students report, search, and recover lost belongings — no more WhatsApp chaos.

<br />

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Academic-lightgrey?style=flat-square)]()
[![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square)]()

<br />

[Report a Bug](../../issues) · [Request a Feature](../../issues) · [Live Demo](#) *(coming soon)*

<br />

</div>

---

## The Problem

Every campus has the same story. Someone loses their ID card before an exam. Someone finds a wallet near the canteen. There's no system — so both people post in 5 different WhatsApp groups, hope the right person sees it, and usually give up within 24 hours.

**Reclaim fixes that.**

---

## What It Does

| Action | What happens |
|---|---|
| Lost something | Post it with a photo, location, and date |
| Found something | Log it so the owner can find you |
| Looking for an item | Search and filter by category, location, or keyword |
| Think you found a match | Contact the poster directly via their listed info |
| Item recovered | Mark it resolved — keeps the board clean |

---

## Tech Stack

```
Frontend   →   React 18
Backend    →   Firebase (Auth + Firestore + Storage)
Hosting    →   Firebase Hosting  (planned)
```

---

## Project Structure

```
reclaim/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── ItemCard.jsx
│   │   ├── SearchBar.jsx
│   │   └── FilterPanel.jsx
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Browse.jsx
│   │   ├── PostItem.jsx
│   │   ├── ItemDetails.jsx
│   │   └── Profile.jsx
│   │
│   ├── firebase/
│   │   └── config.js
│   │
│   ├── App.jsx
│   └── index.js
│
├── public/
├── .env.example
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- A Firebase project ([create one here](https://console.firebase.google.com/))

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-username/reclaim.git
cd reclaim

# 2. Install dependencies
npm install

# 3. Add your Firebase config
cp .env.example .env
# Fill in your Firebase keys in .env

# 4. Start the dev server
npm start
```

### Environment Variables

Create a `.env` file in the root:

```env
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

---

## Roadmap

### Phase 1 — Core MVP *(Week 1–2)*
- [x] Project setup — React + Firebase config
- [ ] User authentication (signup / login / logout)
- [ ] Post a lost item (name, description, location, date, image)
- [ ] Post a found item
- [ ] Basic item listing page

### Phase 2 — Search & Discovery *(Week 3)*
- [ ] Keyword search
- [ ] Filter by category (ID card, wallet, electronics, etc.)
- [ ] Filter by location (library, hostel, canteen, etc.)
- [ ] Item details page with full info + contact

### Phase 3 — Interactions & Status *(Week 4)*
- [ ] Claim / contact flow (show poster's contact info)
- [ ] Mark item as Found or Returned
- [ ] User profile page with own posts
- [ ] Edit and delete own posts

### Phase 4 — Polish & Deploy *(Week 5)*
- [ ] Responsive mobile design
- [ ] Empty states, loading skeletons, error handling
- [ ] Deploy to Firebase Hosting
- [ ] Final testing and bug fixes

### Phase 5 — Future Scope *(Post-submission)*
- [ ] AI-based smart matching between lost and found posts
- [ ] In-app messaging / chat
- [ ] Push notifications when a potential match is found
- [ ] Report fake or spam claims
- [ ] Campus-wide SSO / college email verification

---

## Features at a Glance

### Authentication
Secure email/password login via Firebase Auth. Every post is tied to a verified user account.

### Post Lost / Found Item
Upload a photo, describe the item, tag the location and date. Takes under a minute.

### Browse & Search
A live search bar with category and location filters. See all active listings at a glance.

### Item Details
Full-page view with image, description, when and where it was found/lost, and how to reach the poster.

### Status System
Posters can mark their item as **Returned** once recovered. Resolved items are archived, keeping the feed relevant.

---

## Team

| Name | Role |
|---|---|
| Seyanshu Mukherjee|
| Shreemoyee Roy |
| Garvit Dhuran |

---

## Contributing

This is an academic project. If you'd like to suggest improvements or report a bug, open an issue.

---

## License

Built for academic purposes — Reclaim, 2025.

---

<div align="center">
<sub>Made with intent by Seyanshu, Shreemoyee & Garvit</sub>
</div>
