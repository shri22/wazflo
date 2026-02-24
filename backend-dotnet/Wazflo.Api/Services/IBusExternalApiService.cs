using System.Collections.Generic;
using System.Threading.Tasks;

namespace Wazflo.Api.Services
{
    public interface IBusExternalApiService
    {
        Task<List<ExternalBusSearchResult>> SearchBusesAsync(string apiType, string url, string key, string secret, string fromDate, string toDate, string city, string type);
        Task<ExternalBookingResult> BookBusAsync(string apiType, string url, string key, string secret, ExternalBookingRequest request);
    }

    public class ExternalBusSearchResult
    {
        public string ExternalId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Rate { get; set; }
        public int Capacity { get; set; }
        public string Type { get; set; } = "AC";
    }

    public class ExternalBookingRequest
    {
        public string ExternalBusId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string FromDate { get; set; } = string.Empty;
        public string ToDate { get; set; } = string.Empty;
        public int Passengers { get; set; }
        public string Route { get; set; } = string.Empty;
    }

    public class ExternalBookingResult
    {
        public bool Success { get; set; }
        public string? ExternalBookingId { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
