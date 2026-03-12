namespace Wazflo.Api.DTOs
{
    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponse
    {
        public bool Success { get; set; }
        public LoginData? Data { get; set; }
        public string? Error { get; set; }
    }

    public class LoginData
    {
        public string Username { get; set; } = string.Empty;
        public int? StoreId { get; set; }
        public int IsSuperAdmin { get; set; }
        public string? IndustryType { get; set; }
        public bool HasDynamicDashboard { get; set; }
        public string Token { get; set; } = string.Empty;
    }
}
