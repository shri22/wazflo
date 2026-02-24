# 🚀 Wazflo: Platform Features & Architecture Guide

Wazflo is a multi-tenant WhatsApp Commerce platform designed to empower merchants to sell directly through WhatsApp while providing Super Administrators with centralized control over an entire ecosystem of stores.

---

## 🔄 The Wazflo Workflow

### **Visual Flowchart**
```text
[ 1. ONBOARDING ] ---> [ 2. SHOPPING ] ---> [ 3. BILLING ] ---> [ 4. PROFIT ]
       |                      |                      |                    |
 Merchant Signs Up      Customer says "Hi"      Order Created        Your Commission 
 Wallet Top-up         Bot sends Catalog       Wallet Deducted      Subscription Entry
 Upload Products       Checkout & Pay          Meta Settlement      100% Support Profit
```

### **Detailed Step-by-Step Flow**
1.  **Merchant Setup:** Merchant tops up their virtual wallet (Prepaid).
2.  **Customer Interaction:** Customer initiates chat $\rightarrow$ Bot handles browsing & checkout for FREE (Meta Service Window).
3.  **Revenue Capture:** Wazflo deducts your markup (Fixed Price) from the Merchant's wallet instantly.
4.  **Meta Billing:** Meta bills you later at the lower base rate. You keep the difference + the ₹999 plan fee.

---

## 🏬 1. Multi-Store Management
Wazflo is built from the ground up to support multiple independent stores on a single platform.

**Related Documentation:**
*   [Pricing & Profit Logic](./PRICING_AND_PROFIT_LOGIC.md)

### **Super Administrator Features**
*   **Global Store Switcher:** A dedicated dropdown in the Sidebar (Web) and Dashboard (Mobile) allowing Super Admins to rapidly context-switch between stores.
*   **Platform-Wide Stats:** High-level analytics showing total stores, total platform revenue, and national reach.
*   **Tenant Isolation:** Data (Orders, Products, Customers) is strictly scoped to the `store_id`. A Super Admin can see *everything*, while a Store Admin is restricted to their own entity.
*   **Auth Header Control:** Uses the `X-Store-Id` header to allow Super Admins to "impersonate" or manage different store contexts without logging out.

### **Store Administrator Features**
*   **Dedicated Store Identity:** Custom store name, branding, and contact details.
*   **Isolated Management:** Independent catalogs and order pipelines.

---

## 📈 2. Revenue Reporting & Analytics
Real-time financial visibility across both Web and Mobile interfaces.

*   **7-Day Revenue Report:** Beautiful, animated bar charts showing daily income trends based on actual WhatsApp sales.
*   **Key Performance Indicators (KPIs):**
    *   **Today's Sales:** Instant snapshot of current performance.
    *   **Order Volume:** Tracking the number of incoming orders by day, week, and month.
    *   **Avg Revenue Per Store:** (Super Admin Only) Benchmarking store performance across the platform.

---

## 🛍️ 3. Unified Product Catalog
A robust system to manage digital and physical inventory.

*   **Product Management:** Add/Edit/Delete products with names, descriptions, categories, and base prices.
*   **Variant Support:** Manage different sizes, colors, or materials for each product.
*   **Dynamic Image Hosting:** Integrated image upload system (`/uploads` endpoint) for product visuals.
*   **WhatsApp Integration:** All products are instantly available in the WhatsApp Flow for customers to browse.

---

## 📦 4. Order & Transaction Management
A streamlined pipeline from WhatsApp chat to final delivery.

*   **WhatsApp Flow Integration:** Customers can browse, select, and checkout entirely inside WhatsApp.
*   **Order Status Tracking:** Live lifecycle tracking through `Pending` ➔ `Confirmed` ➔ `Shipped` ➔ `Delivered`.
*   **Platform Scoping:** Every order is tagged with a `store_id`, ensuring correct revenue allocation and reporting.
*   **Order Numbers:** Auto-generated unique transaction IDs for customer support.

---

## 📢 5. Customer Engagement & Marketing
Drive sales with proactive outreach and automated tools.

*   **Broadcast Campaigns:** Send bulk WhatsApp messages to customer segments.
*   **Custom Templates:** Manage reusable WhatsApp Message Templates with variables.
*   **Smart Recovery:** Integrated cron jobs check for abandoned "flows" and send automatic recovery reminders every hour.
*   **Customer Tagging:** Segment your audience (e.g., "Frequent Buyer", "Lead") for targeted campaigns.

---

## 📱 6. Wazflo Admin Mobile App (Expo)
Management-on-the-go with native mobile features.

*   **Real-time Dashboard:** Synchronized KPIs and revenue charts.
*   **Product Addition:** Take photos of new inventory and upload them directly from your phone.
*   **Order Management:** Update order statuses while in the warehouse or on the move.
*   **Push Notifications:** Receive instant alerts for new orders or low inventory (via Expo Push API).
*   **Secure Authentication:** Mobile-first login using `SecureStore` for token management.

---

## 🛠️ 7. Technical Infrastructure
A modern, scalable stack designed for performance.

*   **Backend:** Node.js + Express.js.
*   **Database:** SQLite (Relational structure with Multi-tenant indexing).
*   **Frontend (Admin):** React + Vite (Ultra-premium Glassmorphism UI).
*   **Mobile:** React Native + Expo + Lucide Icons.
*   **Authentication:** JWT-based stateless auth with Super Admin role elevation.
*   **Styling:** Modern Vanilla CSS variables for a consistent "Dark/Blue" premium aesthetic across all panels.

## 💰 8. Revenue Engine & Billing
Wazflo is not just a tool; it's a **business in a box** for Super Admins.

*   **White-Label Profitability:** Set your own markups on WhatsApp messages. Profit from Meta’s "Free Service Windows" by charging merchants for support chats.
*   **The Virtual Wallet:** Integrated prepaid credit system. Merchants top up their wallet via the Super Admin, and the system automatically deducts fees per message.
*   **Subscription Management:** Automated tracking of the ₹999/month platform fee.
*   **Low-Balance Protection:** Automatic service pausing if a merchant’s wallet hits zero, ensuring the Super Admin never loses money to Meta.

---

## 🔑 Default Credentials
*   **Access URL:** [http://localhost:5173](http://localhost:5173)
*   **Admin Username:** `admin`
*   **Passcode:** `demo123`

---

*For a deep dive into the math, see the [Pricing & Profit Logic](./PRICING_AND_PROFIT_LOGIC.md) guide.*
