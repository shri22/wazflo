# Wazflo Enterprise Edition

Welcome to the streamlined, enterprise-ready version of Wazflo. This project has been migrated to a modern tech stack focused on scalability and performance.

## 🏗️ Architecture
The system is now split into two main components:

1.  **Backend API (`backend-dotnet`):** 
    - Built with **.NET 8** and **C#**.
    - Powered by **Microsoft SQL Server** for enterprise-grade data management.
    - Features JWT Authentication, EF Core, and automated WhatsApp/Razorpay integrations.
    
2.  **Frontend Admin Panel (`admin-panel`):**
    - Built with **React.js** and **Vite**.
    - Premium dark-mode dashboard for managing stores, orders, and products.
    - Real-time communication with the .NET API.

3.  **Mobile Assistant (`WazfloAdminApp`):**
    - Built with **React Native / Expo**.
    - Allows store owners to manage their business on the go.

## 🚀 Getting Started

### 1. Setting up the API
- Navigate to `backend-dotnet/Wazflo.Api`.
- Update your SQL Server connection string in `appsettings.json`.
- Run `dotnet restore` and `dotnet run`.

### 2. Running the Admin Panel
- Navigate to `admin-panel`.
- Run `npm install` and `npm run dev`.

## 📦 Removed Legacy Components
To keep the project clean, the following legacy items have been removed:
- Old Node.js / SQLite backend.
- Legacy static landing pages.
- Non-essential sales and documentation drafts.

---
**Status:** Architecture Migrated to .NET / SQL Server ✅
