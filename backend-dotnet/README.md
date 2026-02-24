# Wazflo .NET Backend

This is the migrated backend for Wazflo, built using **.NET 8** and **SQL Server**.

## Tech Stack
- **Framework:** .NET 8 Web API
- **Database:** Microsoft SQL Server
- **ORM:** Entity Framework Core
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** BCrypt for password hashing

## Getting Started

### Prerequisites
1.  **[.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)** installed on your machine.
2.  **SQL Server Instance** (LocalDB, Express, or Standard).

### Configuration
1.  Open `appsettings.json`.
2.  Update the `DefaultConnection` under `ConnectionStrings` to point to your SQL Server instance.
    ```json
    "ConnectionStrings": {
      "DefaultConnection": "Server=YOUR_SERVER;Database=WazfloDb;Trusted_Connection=True;TrustServerCertificate=True;"
    }
    ```

### Running the Application
1.  Navigate to the project folder:
    ```bash
    cd backend-dotnet/Wazflo.Api
    ```
2.  Restore dependencies:
    ```bash
    dotnet restore
    ```
3.  Apply migrations and create the database (ensure you have `dotnet-ef` tools installed):
    ```bash
    dotnet ef migrations add InitialCreate
    dotnet ef database update
    ```
4.  Run the API:
    ```bash
    dotnet run
    ```

## API Features Ported
- [x] **Authentication:** Login with JWT tokens.
- [x] **Product Management:** Full CRUD for products and variants.
- [x] **Auto-Schema:** SQL Server schema generation via EF Core.
- [ ] **WhatsApp Service:** Integration logic (ready for porting).
- [ ] **Razorpay Service:** Payment logic (ready for porting).

## Project Structure
- `Models/`: Entity classes representing SQL Server tables.
- `Data/`: EF Core DbContext and database configuration.
- `Controllers/`: API Endpoints.
- `DTOs/`: Data Transfer Objects for requests/responses.
