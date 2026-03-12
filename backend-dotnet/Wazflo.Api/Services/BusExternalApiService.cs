using System.Net.Http.Headers;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Wazflo.Api.Services
{
    public class BusExternalApiService : IBusExternalApiService
    {
        private readonly HttpClient _httpClient;

        public BusExternalApiService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<List<ExternalBusSearchResult>> SearchBusesAsync(string apiType, string url, string key, string secret, string fromDate, string toDate, string city, string type)
        {
            if (apiType == "BITLA")
            {
                return await SearchBitlaBuses(url, key, secret, fromDate, toDate, city, type);
            }
            if (apiType == "SAI_SENTHIL")
            {
                return await SearchSaiSenthilBuses(url, fromDate, toDate, city, type);
            }
            
            return new List<ExternalBusSearchResult>();
        }

        public async Task<ExternalBookingResult> BookBusAsync(string apiType, string url, string key, string secret, ExternalBookingRequest request)
        {
            if (apiType == "BITLA")
            {
                return await BookBitlaBus(url, key, secret, request);
            }
            if (apiType == "SAI_SENTHIL")
            {
                return await BookSaiSenthilBus(url, request);
            }
            
            return new ExternalBookingResult { Success = false, ErrorMessage = "Unsupported API Type" };
        }

        private async Task<List<ExternalBusSearchResult>> SearchSaiSenthilBuses(string url, string fromDate, string toDate, string city, string type)
        {
            try
            {
                // Mapping to: GET https://srisaisenthiltravels.cloud/api/public/search?fromDate=Y-M-D&toDate=Y-M-D&city=Chennai
                var requestUrl = $"{url.TrimEnd('/')}/api/public/search?fromDate={fromDate}&toDate={toDate}&city={city}";
                
                var response = await _httpClient.GetAsync(requestUrl);
                if (!response.IsSuccessStatusCode) return new List<ExternalBusSearchResult>();

                var content = await response.Content.ReadAsStringAsync();
                // Assume the partner returns a list of buses in a 'buses' array or direct array
                var data = JsonConvert.DeserializeObject<JToken>(content);
                var buses = (data is JObject obj && obj.ContainsKey("buses")) ? obj["buses"] as JArray : data as JArray;

                var results = new List<ExternalBusSearchResult>();
                if (buses != null)
                {
                    foreach (var b in buses)
                    {
                        results.Add(new ExternalBusSearchResult
                        {
                            ExternalId = b["id"]?.ToString() ?? "",
                            Name = b["name"]?.ToString() ?? b["busName"]?.ToString() ?? "Sai Senthil Bus",
                            Rate = b["price"]?.Value<decimal>() ?? b["fare"]?.Value<decimal>() ?? 0,
                            Capacity = b["availableSeats"]?.Value<int>() ?? 40,
                            Type = type
                        });
                    }
                }

                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Sai Senthil Search Error: {ex.Message}");
                return new List<ExternalBusSearchResult>();
            }
        }

        private async Task<ExternalBookingResult> BookSaiSenthilBus(string url, ExternalBookingRequest request)
        {
            try
            {
                // Mapping to: POST https://srisaisenthiltravels.cloud/api/public/book
                var requestUrl = $"{url.TrimEnd('/')}/api/public/book";
                var payload = new
                {
                    busId = request.ExternalBusId,
                    name = request.CustomerName,
                    phone = request.Phone,
                    fromDate = request.FromDate,
                    toDate = request.ToDate,
                    passengers = request.Passengers,
                    route = request.Route
                };

                var response = await _httpClient.PostAsync(requestUrl, new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json"));
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var data = JsonConvert.DeserializeObject<JObject>(content);
                    return new ExternalBookingResult 
                    { 
                        Success = true, 
                        ExternalBookingId = data?["bookingId"]?.ToString() ?? data?["id"]?.ToString() 
                    };
                }

                return new ExternalBookingResult { Success = false, ErrorMessage = content };
            }
            catch (Exception ex)
            {
                return new ExternalBookingResult { Success = false, ErrorMessage = ex.Message };
            }
        }

        private async Task<List<ExternalBusSearchResult>> SearchBitlaBuses(string url, string key, string secret, string fromDate, string toDate, string city, string type)
        {
            try
            {
                // Note: This is an example implementation following Bitla GDS patterns
                // Bitla often uses API Keys in headers or as part of the query
                var requestUrl = $"{url.TrimEnd('/')}/api/v1/availabilities?api_key={key}&from_date={fromDate}&to_date={toDate}&origin={city}&bus_type={type}";
                
                var response = await _httpClient.GetAsync(requestUrl);
                if (!response.IsSuccessStatusCode) return new List<ExternalBusSearchResult>();

                var content = await response.Content.ReadAsStringAsync();
                var data = JsonConvert.DeserializeObject<JObject>(content);

                var results = new List<ExternalBusSearchResult>();
                var buses = data?["availabilities"] as JArray;

                if (buses != null)
                {
                    foreach (var b in buses)
                    {
                        results.Add(new ExternalBusSearchResult
                        {
                            ExternalId = b["id"]?.ToString() ?? "",
                            Name = b["bus_name"]?.ToString() ?? "Bitla Bus",
                            Rate = b["fare"]?.Value<decimal>() ?? 0,
                            Capacity = b["available_seats"]?.Value<int>() ?? 40,
                            Type = type
                        });
                    }
                }

                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Bitla Search Error: {ex.Message}");
                return new List<ExternalBusSearchResult>();
            }
        }

        private async Task<ExternalBookingResult> BookBitlaBus(string url, string key, string secret, ExternalBookingRequest request)
        {
            try
            {
                var requestUrl = $"{url.TrimEnd('/')}/api/v1/bookings?api_key={key}";
                var payload = new
                {
                    bus_id = request.ExternalBusId,
                    passenger_details = new { name = request.CustomerName, phone = request.Phone },
                    journey_date = request.FromDate,
                    return_date = request.ToDate,
                    seats = request.Passengers
                };

                var response = await _httpClient.PostAsync(requestUrl, new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json"));
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var data = JsonConvert.DeserializeObject<JObject>(content);
                    return new ExternalBookingResult 
                    { 
                        Success = true, 
                        ExternalBookingId = data?["booking_id"]?.ToString() 
                    };
                }

                return new ExternalBookingResult { Success = false, ErrorMessage = content };
            }
            catch (Exception ex)
            {
                return new ExternalBookingResult { Success = false, ErrorMessage = ex.Message };
            }
        }
    }
}
