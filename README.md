<div align="center">

# 𝕏 TwitterX

**A modern, full-stack Twitter/X-inspired social platform**

Built with Next.js, React, TypeScript, Prisma, and Supabase — delivering a realistic social media experience with authentication, notifications, multimedia tweets, language personalization, and premium features.

[**Live Demo**](https://twitter-x-rho.vercel.app) · [Report Bug](https://github.com/DishantBhere/TwitterX/issues) · [Request Feature](https://github.com/DishantBhere/TwitterX/issues)

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript) ![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma) ![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase) ![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## 📖 Overview

TwitterX reimagines the classic X (Twitter) experience with a modern web stack. It supports rich media tweets, real-time notifications, secure authentication flows, direct messaging, and a premium subscription tier — all wrapped in a responsive, dark-themed UI.

---

## ✨ Features

### 🔐 Authentication
- Email & password authentication
- Google OAuth login
- JWT-based session management
- Forgot password with OTP verification

### 🐦 Tweets
- Create, delete, like/unlike, and retweet
- Reply threads
- Image, GIF, and audio uploads with media preview
- Browser notifications for cricket & science tweets

### 👤 User Profile
- Editable profile, profile picture, and banner
- Follow / unfollow system
- Premium verification badge with custom secret code

### ⚙️ Settings
- Dark theme
- Multi-language support (English, Spanish, Hindi, Portuguese, Chinese, French) with OTP-gated language switching
- Login history tracking
- Browser notification preferences

### 💬 Messaging
- Send & delete messages
- Threaded conversation view

### 🔔 Notifications
- Real-time in-app notifications
- Browser push notifications
- Read/unread tracking

### 💎 Premium
- Subscription plans with Razorpay integration
- Verified badge unlock

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14, React, TypeScript, Material UI |
| **Backend** | Next.js API Routes, Prisma ORM |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | JWT, Google OAuth |
| **Storage** | Supabase Storage |
| **Payments** | Razorpay |
| **Deployment** | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- A Supabase project (for database & storage)

### Installation

```bash
# Clone the repository
git clone https://github.com/DishantBhere/TwitterX.git
cd TwitterX

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the root directory and configure the required variables (database URL, auth secrets, OAuth keys, Supabase keys, Razorpay keys, etc.).

### Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 📸 Screenshots

# 🏠 Home Page
<img width="800" alt="Home Page" src="https://github.com/user-attachments/assets/87112e44-63b3-4680-aafe-adff0d71daba" />

# 👤 Profile Page
<img width="800" alt="Profile Page" src="https://github.com/user-attachments/assets/8c7f2803-ce26-44bc-b536-12590e0c1ba5" />

# 💎 Premium Page
<img width="800" alt="Premium Page" src="https://github.com/user-attachments/assets/ee5185ab-d708-4fd3-97a9-87ec3e288ac0" />

# 🌍 Language Support

<table>
<tr>
<td align="center"><b>Hindi</b><br/><img width="380" alt="Hindi" src="https://github.com/user-attachments/assets/057f5358-9bbf-4ad9-92ce-0be61b869a1f" /></td>
<td align="center"><b>Chinese</b><br/><img width="380" alt="Chinese" src="https://github.com/user-attachments/assets/3cdbcdce-c01c-4dce-a5fe-17acc9850b28" /></td>
</tr>
<tr>
<td align="center"><b>Portuguese</b><br/><img width="380" alt="Portuguese" src="https://github.com/user-attachments/assets/439d50df-0f77-452a-b305-dd1f709dc7fe" /></td>
<td align="center"><b>French</b><br/><img width="380" alt="French" src="https://github.com/user-attachments/assets/295f06f8-0609-404b-92e5-47bcb954858f" /></td>
</tr>
<tr>
<td align="center" colspan="2"><b>Spanish</b><br/><img width="380" alt="Spanish" src="https://github.com/user-attachments/assets/6c423faf-727a-4e35-adfd-b6c1a5cd390d" /></td>
</tr>
</table>



---

## 🗺️ Roadmap

- [ ] Real-time chat via WebSockets
- [ ] Push notifications
- [ ] Video upload support
- [ ] Infinite feed optimization
- [ ] Enhanced mobile responsiveness

---


## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](https://github.com/DishantBhere/TwitterX/issues).

---

## 👨‍💻 Author

**Dishant Bhere**
GitHub: [@DishantBhere](https://github.com/DishantBhere)

---

## 📄 License

Distributed under the **MIT License**.
