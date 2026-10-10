# 🎨 HITian Inside — Event Registration & Certificate Verification Frontend

Modern, high-performance web application built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **TailwindCSS** for the official **HITian Inside** event portal.

---

## 🌟 Key Features & User Experiences

### 🎭 Pratidhwani Flagship Event Experience
- **Dedicated Landing Page (`/events/[id]`)**:
  - Stylized hero banner (*ONE LINER ... ONE LINER..*), club branding badge, and RS. 50/- ONLY fee badge.
  - Interactive **3 Competition Categories Grid** (*OPEN MIC*, *YOUTH PARLIAMENT*, *LIVE ART*).
  - Guidelines breakdown and poster social media handles banner.
- **5-Step Paid Registration Wizard (`/events/[id]/register`)**:
  - **Step 1**: Personal details form (Name, Dept, Year, Roll Number, Email, Mobile) + **Multi-Select Event Categories** (select 1, 2, or all 3 events with real-time dynamic total fee calculation: ₹50 per event).
  - **Step 2**: Payment Processing with dynamic fee amount, visual UPI QR Code (`hitianinside@upi`), UTR Transaction UID, and UPI ID verification.
  - **Step 3**: Instant WhatsApp Group redirect.
  - **Step 4**: **Digital Receipt Pass Card** featuring top-right scannable `QR_UID`, enrolled category list, payment status, and print/download button.
  - **Step 5**: QR Code Entrance Scanner integration.

### 🇮🇳 Swaraj-E-Hind Flagship Landing Page
- Tricolour gradient theme, domain selection (Photography, Reel Making, Creative Writing, Digital Art), evaluation rules breakdown, and Google Drive / Cloudinary file submission handling.

### 💼 General Enterprise Admin Console (`/admin`)
- **Professional Dark Slate Theme (`#0b0f19`)**: Completely decoupled from public event themes for a sleek, enterprise administrative dashboard look.
- **Event Presets Loader**: Instant one-click template dropdown (*Swaraj-E-Hind 4.0*, *Pratidhwani*, *Blank Template*).
- **Website Visibility Control**: Interactive **👁️ Shown on Website** / **🙈 Hidden from Website** toggle button on every event card.
- **Form Builder & Submissions Portal**: Custom dynamic form field builder, real-time analytics, check-in scanner, and CSV export.

### 👁️ Observer Live Preview Portal (`/observer`)
- Dedicated observer passcode authentication.
- **Live Submission Photo Grid Preview**: Observers can preview submission images directly within the grid layout without needing to open individual modal files.

---

## 📁 App Directory & Routing (`src/app/`)

```
frontend/src/
├── app/
│   ├── page.tsx                           # Public Main Events Catalog & Search Bar
│   ├── admin/
│   │   ├── page.tsx                       # General Admin Panel & Analytics Dashboard
│   │   └── events/
│   │       ├── create/page.tsx            # Event Creator with Preset Dropdown & Visibility Toggle
│   │       └── [id]/
│   │           ├── edit/page.tsx          # Details & Banner Image Cropper Modal Editor
│   │           ├── form-builder/page.tsx  # Dynamic Custom Form Field Builder
│   │           └── submissions/page.tsx   # Submissions Manager & QR Check-in System
│   ├── events/[id]/
│   │   ├── page.tsx                       # Dedicated Flagship Landing Page (Pratidhwani / Swaraj)
│   │   └── register/page.tsx              # 5-Step Registration Wizard & Digital Receipt Pass
│   └── observer/page.tsx                  # Observer Live Preview & Verification Portal
├── components/                            # Reusable UI Components (Navbar, EventCard, CropperModal)
├── services/                              # Frontend API Service & Health Checker
└── types/                                 # TypeScript Data Definitions
```

---

## ⚙️ Environment Setup (`.env.local`)

Create a `.env.local` file in `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_LIVE_API_URL=https://hitianinside-event-backend.vercel.app/api
```

---

## 🚦 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Open Application**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

4. **Build Production Bundle**:
   ```bash
   cmd /c "npm run build"
   ```
