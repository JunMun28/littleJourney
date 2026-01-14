# Little Journey - Product Requirements Document

## Executive Summary

Little Journey is a baby milestone journal mobile app designed for the Singapore market. It enables parents to capture and preserve precious moments of their child's growth through photos, videos, and journal entries, while privately sharing these memories with family members across borders.

**Core Value Proposition:** A privacy-first, culturally-aware baby journal that reduces the friction of memory-keeping for busy parents while enabling seamless sharing with family members who may not be tech-savvy.

**Target Market:** Singapore parents (primary), with family members in Malaysia, China, India, and other countries (secondary viewers).

**Platform Strategy:**
- **Expo Mobile App (iOS + Android):** Primary experience for parents
- **Web Viewer (TanStack Start):** Lightweight view-only experience for family members via magic links

**Domain:** littlejourney.sg

---

## Market Context

### Opportunity

- Singapore's 2024 total fertility rate of 0.97 means each child receives intense documentation attention
- Family-centric culture with strong emphasis on milestone celebrations
- Multicultural families often span countries, making private digital sharing essential
- No Singapore-focused baby journal with local milestone templates exists
- ~50% iPhone market share in Singapore makes native iOS experience critical

### Competitive Landscape

| Competitor | Strengths | Gaps |
|------------|-----------|------|
| Tinybeans | Calendar timeline, family sharing | No cultural milestones, no SG focus |
| Qeepsake | SMS prompts reduce friction | SMS feels dated in SG (WhatsApp dominant) |
| BabyCenter | Developmental information | Not memory-focused |
| Instagram | Familiar UX | No privacy, no organization |

### Differentiation

1. Singapore cultural milestone templates (Chinese, Malay, Indian traditions)
2. Magic link sharing for non-tech-savvy family members (no account required)
3. AI-powered semantic search across photos and entries
4. Native mobile experience with reliable push notifications
5. Feed-first design optimized for "catching up" on baby moments

---

## User Personas

### Primary: Singapore Parent (Content Creator)

**Demographics:** 28-40 years old, working professional, smartphone-native

**Needs:**
- Capture moments quickly without friction
- Organize memories chronologically
- Share privately with family (not social media)
- Remember cultural milestone dates

**Pain Points:**
- Too busy to maintain organized journal
- Photos scattered across phone gallery
- Privacy concerns with Facebook/Instagram
- Grandparents overseas miss milestones

**Device:** iPhone or Android smartphone (primary), occasional tablet use

### Secondary: Family Member (Content Viewer)

**Demographics:** 50-75 years old, varying tech comfort, may be overseas

**Needs:**
- See baby updates regularly
- Simple access without app complexity
- View on phone or tablet
- Optionally leave comments

**Pain Points:**
- App stores and account creation feel overwhelming
- Forgets passwords
- Different devices (phone at home, tablet when traveling)

**Access Method:** Web viewer via magic link (no app installation required)

---

## Technical Architecture

### Platform Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐    ┌─────────────────────────┐    │
│  │   Expo Mobile App       │    │   Web Viewer            │    │
│  │   (Parents - Primary)   │    │   (Family - View Only)  │    │
│  ├─────────────────────────┤    ├─────────────────────────┤    │
│  │ • Expo Router           │    │ • TanStack Start        │    │
│  │ • TanStack Query        │    │ • TanStack Query        │    │
│  │ • NativeWind (Tailwind) │    │ • Tailwind CSS          │    │
│  │ • expo-camera           │    │ • View-only feed        │    │
│  │ • expo-media-library    │    │ • Comments/reactions    │    │
│  │ • expo-notifications    │    │ • Magic link auth       │    │
│  │ • expo-image-picker     │    │ • No entry creation     │    │
│  │ • expo-file-system      │    │                         │    │
│  └─────────────────────────┘    └─────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│  Cloudflare Workers (Hono)                                      │
│  • RESTful API endpoints                                        │
│  • Authentication middleware                                    │
│  • Rate limiting                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│  Neon PostgreSQL     │  Cloudflare R2    │  Cloudflare Stream  │
│  (Database)          │  (Photo storage)  │  (Video processing) │
├──────────────────────┴──────────────────┴─────────────────────┤
│  Cloudflare Vectorize        │  Cloudflare Workers AI          │
│  (Semantic search)           │  (Image descriptions)           │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Mobile App | Expo (Managed) | iOS + Android from single codebase |
| Mobile Navigation | Expo Router | File-based routing |
| Mobile Styling | NativeWind | Tailwind CSS for React Native |
| Mobile State | TanStack Query | Server state management |
| Web Viewer | TanStack Start | SSR React for family viewers |
| API | Cloudflare Workers + Hono | Edge API endpoints |
| Database | Neon PostgreSQL | Primary data store (Singapore region) |
| ORM | Drizzle | Type-safe database queries |
| Photo Storage | Cloudflare R2 | Object storage with CDN |
| Video | Cloudflare Stream | Transcoding + adaptive streaming |
| Vector DB | Cloudflare Vectorize | Semantic search embeddings |
| AI | Cloudflare Workers AI | Image descriptions + embeddings |
| Auth | Better Auth | Magic links + OAuth |
| Email | Resend | Transactional emails |
| Push | Expo Notifications | iOS + Android push |
| Payments | Stripe | Subscriptions + SG payment methods |
| Analytics | PostHog | Privacy-friendly product analytics |
| Errors | Sentry | Error tracking |

### Expo Libraries

| Need | Library | Notes |
|------|---------|-------|
| Navigation | `expo-router` | File-based routing |
| Styling | `nativewind` | Tailwind for React Native |
| State | `@tanstack/react-query` | Same patterns as web |
| Camera | `expo-camera` | Camera capture |
| Gallery | `expo-image-picker` | Photo/video selection |
| Media Library | `expo-media-library` | Access device photos |
| Push | `expo-notifications` | iOS + Android push |
| File System | `expo-file-system` | Upload handling |
| Background | `expo-background-fetch` | Background uploads |
| Secure Storage | `expo-secure-store` | Auth tokens |
| Video Player | `expo-av` | Video playback |
| Image | `expo-image` | Fast image loading |

### Platform Requirements

| Platform | Minimum Version | Coverage |
|----------|-----------------|----------|
| iOS | 13.0+ | ~99% of devices |
| Android | API 23 (6.0+) | ~95% of devices |

### Monorepo Structure

```
little-journey/
├── apps/
│   ├── mobile/                 # Expo app
│   │   ├── app/                # Expo Router screens
│   │   ├── components/         # UI components
│   │   ├── hooks/              # Custom hooks
│   │   ├── app.json
│   │   └── eas.json
│   │
│   └── web/                    # TanStack Start (family viewer)
│       ├── app/
│       │   └── routes/
│       └── package.json
│
├── packages/
│   ├── api/                    # Cloudflare Workers
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   └── lib/
│   │   └── wrangler.toml
│   │
│   ├── db/                     # Database schema
│   │   ├── schema/
│   │   └── migrations/
│   │
│   └── shared/                 # Shared code
│       ├── types/
│       ├── validation/
│       └── constants/
│
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Feature Specifications

### 1. User Authentication & Onboarding

#### 1.1 Authentication Methods

- Email magic link (primary)
- Google OAuth
- Apple Sign-In

No password-based authentication to reduce friction and support issues.

#### 1.2 Token Storage

- Auth tokens stored in `expo-secure-store`
- Automatic token refresh
- Biometric unlock option (future)

#### 1.3 Guided Onboarding Flow

**Step 1:** Sign up (email/Google/Apple)

**Step 2:** Add first child
- Name (required)
- Display name/nickname (optional)
- Date of birth (required)
- Photo (optional)

**Step 3:** Select cultural tradition (single selection)
- Chinese
- Malay
- Indian
- None/Other

**Step 4:** Set daily prompt time
- Time picker defaulting to 8:00 PM SGT
- Explanation of prompt purpose

**Step 5:** Invite first family member (optional)
- Email input
- Permission level selection
- Skip option available

**Step 6:** First entry prompt
- "Add your first moment!"
- Camera/gallery permission request

### 2. Child Management

#### 2.1 Child Profile

**Required Fields:**
- Name
- Date of birth

**Optional Fields:**
- Display name (shown to family instead of real name)
- Profile photo
- Cultural tradition

#### 2.2 Multi-Child Support

- MVP launches with single child
- "Add another child" unlocked after initial release
- Per-child family member permissions

#### 2.3 Pregnancy Support

- Entries can be backdated to before child's birth date

### 3. Entry Creation

#### 3.1 Entry Types

**Photo Entry:**
- Single or multiple photos (displayed as carousel)
- Caption (optional)
- Date (auto-filled from EXIF, editable)
- Custom tags (optional)

**Video Entry:**
- Video upload with tier-based limits
- Caption (optional)
- Date (auto-filled from metadata, editable)

**Text Entry:**
- Text-only journal entry
- Date selection

#### 3.2 Entry Creation Flow

1. Tap floating "+" button
2. Choose entry type: Photo / Video / Text
3. For photo/video: Select from gallery (primary) or capture new
4. Add caption (optional, prompted but skippable)
5. Confirm date (pre-filled from EXIF/metadata)
6. Add tags (optional)
7. Post entry

#### 3.3 Media Selection

- **Primary:** Gallery picker via `expo-image-picker`
- **Secondary:** Camera capture via `expo-camera`
- Multiple photo selection supported
- Photos displayed as swipeable carousel

#### 3.4 EXIF Date Detection

- Automatically extract date from photo metadata
- Pre-fill date field
- User can override manually

#### 3.5 Draft Auto-Save

- Incomplete entries saved automatically
- Resume on next app open
- Single draft per user

#### 3.6 Entry Ownership & Editing

**Attribution Model:** Individual ownership with family editing

- Entries show "Posted by [Parent Name]"
- Either parent can edit any entry
- Edits show "Edited by [Editor Name]"
- Either parent can delete any entry

### 4. Timeline & Feed

#### 4.1 Primary View: Feed

- Tab bar navigation with Feed as first tab
- Reverse chronological (newest first)
- Infinite scroll with pagination
- Pull-to-refresh

#### 4.2 Entry Card Display

- Photo/video thumbnail or text preview
- Caption
- Date
- "Posted by" attribution
- Comment count
- Reaction summary
- Tags

#### 4.3 Photo Carousel

- Swipeable for multi-photo entries
- Dot indicators
- Full-screen view on tap

#### 4.4 Video Playback

- Inline playback in feed
- Tap for full-screen with controls
- Adaptive bitrate streaming via Cloudflare Stream

#### 4.5 "On This Day" Memories

- Push notification when memories exist from previous years
- Memory card in feed
- Links to historical entry

### 5. Milestones

#### 5.1 Milestone Templates by Culture

**Chinese Milestones:**
- 满月 (Full Month) - Day 30
- 百日 (100 Days) - Day 100
- 抓周 (Zhua Zhou) - Day 365
- First Lunar New Year

**Malay Milestones:**
- Aqiqah - Day 7
- Cukur Jambul (Head Shaving)
- First Hari Raya

**Indian Milestones:**
- Naming Ceremony
- Annaprashan (First Solid Food)
- First Deepavali

**Universal Milestones:**
- First smile, First laugh, First steps, First words
- First tooth, First haircut, First day of school

#### 5.2 Dual Date System

- **Milestone date:** Traditional/calculated date
- **Celebration date:** When family actually celebrated

#### 5.3 Milestone UI

- Dedicated Milestones tab
- Upcoming milestones with countdown
- Completed milestones with photos
- Custom milestone creation

### 6. Family Sharing

#### 6.1 Invitation Flow (Mobile App)

1. Parent taps "Invite Family" in settings
2. Enter email + relationship + permission level
3. System sends magic link email
4. Link opens web viewer (no app required)

#### 6.2 Web Viewer (Family Members)

- Accessible via magic link
- No account creation required
- View feed, comments, reactions (based on permission)
- Session persists on device
- Multi-device support with same link

#### 6.3 Permission Levels

| Permission | View | Comment | React | Add Entries |
|------------|------|---------|-------|-------------|
| View Only | ✓ | ✗ | ✗ | ✗ |
| View + Interact | ✓ | ✓ | ✓ | ✗ |

#### 6.4 Link Management

- Expires after 90 days of inactivity
- Parent can resend link
- Parent can revoke access (silent)
- Parent sees "last viewed" timestamp

#### 6.5 Comment Moderation

- Parents can delete any comment
- Comments persist after access revocation

### 7. Notifications

#### 7.1 Push Notification Types

| Type | Trigger | Default |
|------|---------|---------|
| Daily Prompt | Scheduled time | On |
| Memories | "On this day" | On |
| Milestone Reminder | X days before | On |
| Family Activity | Comment/reaction | On |
| Storage Warning | 80%, 90%, 100% | On (locked) |

#### 7.2 Implementation

- Expo Push Notifications service
- Works reliably on iOS and Android
- No FCM/APNs configuration required (Expo handles it)

#### 7.3 Smart Frequency

- Starts daily
- Reduces to every 2 days if ignored 3+ days
- Reduces to weekly if ignored 7+ days
- Resets to daily after user posts

#### 7.4 Notification Settings

- Simple on/off toggle per category
- Accessible from Settings tab

### 8. Search & Discovery

#### 8.1 AI-Powered Semantic Search

- Text search in captions
- Semantic search in images
- Filter by date range, media type, milestones
- Custom tag search
- All children by default, filter available

#### 8.2 AI Pipeline

1. Photo uploaded to R2
2. Background worker triggered
3. Workers AI generates image description
4. Combined embedding: image + caption + description
5. Stored in Vectorize
6. Entry marked searchable

#### 8.3 Search Results

- Relevance-ordered (not chronological)
- Shows closest matches even if low confidence
- Dedicated Search tab in app

### 9. Video Handling

#### 9.1 Tier Limits

| Tier | Max Video Length | Storage |
|------|------------------|---------|
| Free | No video | 500MB |
| Standard ($4.99/mo) | 2 minutes | 10GB |
| Premium ($9.99/mo) | 10 minutes | 50GB |

#### 9.2 Upload Flow

1. Select video via `expo-image-picker`
2. Client checks duration against tier limit
3. Request presigned URL from API
4. Direct upload to Cloudflare Stream
5. Stream handles transcoding
6. Thumbnail auto-generated

#### 9.3 Playback

- `expo-av` for video player
- HLS streaming from Cloudflare Stream
- Adaptive bitrate based on connection

### 10. Photo Book Export

#### 10.1 Trigger

- System prompt at child's first birthday
- On-demand from Settings

#### 10.2 Generation

- Auto-layout from milestone entries
- Preview and customize
- Add/remove entries, reorder, edit captions

#### 10.3 Export

- PDF download (premium feature)
- Print ordering integration (future)

### 11. Data & Privacy

#### 11.1 Data Export

- "Download all memories" in Settings
- ZIP file: folders by year/month, original media, entries.json
- Available to all tiers

#### 11.2 Account Deletion

- Self-service with confirmation (type "DELETE")
- 30-day grace period
- Can cancel during grace period
- All data permanently deleted after

#### 11.3 Data Location

- Neon PostgreSQL: Singapore region (ap-southeast-1)
- Cloudflare R2: Automatic global replication
- Cloudflare Vectorize: Edge locations

### 12. Monetization

#### 12.1 Tier Structure

| Feature | Free | Standard | Premium |
|---------|------|----------|---------|
| Price | $0 | $4.99/mo | $9.99/mo |
| Annual | - | $39.99/yr | $79.99/yr |
| Children | 1 | Unlimited | Unlimited |
| Family Members | 5 | Unlimited | Unlimited |
| Photo Storage | 500MB | 10GB | 50GB |
| Video Upload | ✗ | Up to 2 min | Up to 10 min |
| PDF Export | ✗ | ✓ | ✓ |

#### 12.2 Payment

**Provider:** Stripe

**Methods:**
- Credit/debit cards
- PayNow (Singapore)
- GrabPay (Singapore)

#### 12.3 Subscription Management

- Upgrade/downgrade in-app
- Cancel (access until period ends)
- 7-day grace period for failed payments
- Grandfathered content on downgrade

### 13. Admin & Operations

#### 13.1 Admin Dashboard

- View user accounts and storage usage
- Manually adjust limits (support cases)
- No content viewing/moderation

#### 13.2 Rate Limiting

- 50 uploads per hour
- 200 uploads per day

#### 13.3 Analytics

- PostHog for product analytics
- Sentry for error tracking
- Cloudflare Analytics for infrastructure

### 14. Legal

#### 14.1 Required Documents

- Privacy Policy (free template for MVP)
- Terms of Service (free template for MVP)
- Professional review after validation

---

## Development Timeline

### Phase 1: Expo Mobile App (12-14 weeks)

**Weeks 1-2: Foundation**
- Monorepo setup (Turborepo + pnpm)
- Expo project with Expo Router
- Cloudflare Workers + Hono API
- Neon database + Drizzle schema
- Better Auth configuration

**Weeks 3-4: Authentication & Onboarding**
- Magic link auth flow
- Google/Apple OAuth
- Guided onboarding screens
- Child profile creation
- Cultural tradition selection

**Weeks 5-7: Core Features**
- Entry creation (photo/video/text)
- Feed view with infinite scroll
- expo-image-picker integration
- R2 upload with presigned URLs
- Cloudflare Stream video

**Weeks 8-9: Milestones & Search**
- Milestone templates
- Milestone completion flow
- Workers AI integration
- Vectorize semantic search
- Search UI

**Weeks 10-11: Notifications & Sharing**
- Expo push notifications
- Daily prompts with smart frequency
- Family invitation flow
- Email notifications via Resend

**Weeks 12-13: Payments & Polish**
- Stripe integration
- Tier enforcement
- Storage limits
- UI polish
- Performance optimization

**Week 14: Launch**
- App Store + Play Store submission
- Marketing assets
- Launch

### Phase 2: Web Viewer (4-5 weeks)

**Weeks 1-2:** TanStack Start setup, magic link auth
**Weeks 3-4:** View-only feed, comments, reactions
**Week 5:** Deploy to Cloudflare Pages, end-to-end testing

### Phase 3: Enhancements (Ongoing)

- Multi-child support
- Photo book print ordering
- Advanced analytics for parents
- Additional cultural milestone packs

---

## Cost Projections

### Development Phase (Free)

| Item | Cost | Notes |
|------|------|-------|
| Expo Go | Free | Test on physical devices |
| iOS Simulator | Free | Xcode required (Mac) |
| Android Emulator | Free | Android Studio |
| Cloudflare Workers | Free | 100k requests/day |
| Neon | Free | 0.5GB storage |
| EAS Build (dev) | Free | Limited builds |

### Launch Phase (One-time)

| Item | Cost |
|------|------|
| Apple Developer | $99/year |
| Google Play | $25 (one-time) |
| Domain (.sg) | ~$30/year |
| **Total** | **~$155** |

### Operational (Monthly at Scale)

| Scale | Monthly Cost |
|-------|--------------|
| 1,000 families | ~$40 |
| 10,000 families | ~$500 |

---

## Success Metrics

### North Star

**Weekly Active Families:** Families with at least one entry in past 7 days

### Supporting Metrics

| Metric | Target (Month 3) |
|--------|------------------|
| Downloads | 1,000 |
| Activation (first entry) | 70% |
| Weekly retention | 40% |
| Family invites sent | 2 per family |
| Premium conversion | 5% |

### Tracking Events

- signup_completed
- onboarding_completed
- entry_created
- family_member_invited
- milestone_completed
- subscription_started
- search_performed

---

## App Store Presence

### App Name

**Primary:** Little Journey
**Subtitle:** Baby Milestone Journal

### Category

- Primary: Lifestyle
- Secondary: Photo & Video

### Minimum Age Rating

- 4+ (no objectionable content)

---

## Open Questions & Future Considerations

### Deferred Decisions

1. Divorce scenarios: data ownership
2. Child aging out: what happens at 18
3. Account transfer between parents
4. International expansion: localization

### Future Features

1. AI caption suggestions
2. Automated weekly/monthly highlights
3. Growth tracking (height/weight charts)
4. Voice memo entries
5. Collaborative albums (family can contribute)

---

*Document Version: 2.0*
*Last Updated: January 2025*
*Platform: Expo (iOS + Android) + Web Viewer*
