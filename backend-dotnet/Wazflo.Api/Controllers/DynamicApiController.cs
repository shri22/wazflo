using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wazflo.Api.Data;
using Wazflo.Api.Helpers;
using Wazflo.Api.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Net.Http;
using System.Linq;

namespace Wazflo.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DynamicApiController : ControllerBase
    {
        private readonly WazfloDbContext _context;
        private readonly HttpClient _httpClient;

        public DynamicApiController(WazfloDbContext context, HttpClient httpClient)
        {
            _context = context;
            _httpClient = httpClient;
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult> GetDynamicDashboard()
        {
            var (storeId, _, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();
            if (!storeId.HasValue) return BadRequest(new { success = false, error = "Store ID required" });

            var store = await _context.Stores.FindAsync(storeId.Value);
            if (store == null) return NotFound(new { success = false, error = "Store not found" });

            if (string.IsNullOrEmpty(store.DashboardGetUrl))
            {
                return BadRequest(new { success = false, error = "Dynamic dashboard not configured for this store" });
            }

            try
            {
                // Specialized Mapping for known partners
                if (store.ExternalApiType == "SAI_SENTHIL")
                {
                    return await MapSaiSenthilDashboard(store);
                }

                // Default Generic Proxy Logic
                if (string.IsNullOrEmpty(store.DashboardGetUrl))
                {
                    return BadRequest(new { success = false, error = "Dynamic dashboard not configured" });
                }

                using var request = new HttpRequestMessage(HttpMethod.Get, store.DashboardGetUrl);
                if (!string.IsNullOrEmpty(store.ExternalApiKey))
                {
                    request.Headers.Add("Authorization", $"Bearer {store.ExternalApiKey}");
                }

                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, new { success = false, error = "Partner API Error", details = content });
                }

                return Ok(new { success = true, data = JsonConvert.DeserializeObject(content) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = "Proxy Error: " + ex.Message });
            }
        }

        private async Task<ActionResult> MapSaiSenthilDashboard(Store store)
        {
            try
            {
                // Call their 'my-bookings' API: GET https://srisaisenthiltravels.cloud/api/customer/my-bookings
                var requestUrl = $"{store.ExternalApiUrl?.TrimEnd('/')}/api/customer/my-bookings";
                using var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
                if (!string.IsNullOrEmpty(store.ExternalApiKey))
                {
                    request.Headers.Add("Authorization", $"Bearer {store.ExternalApiKey}");
                }

                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                    return StatusCode((int)response.StatusCode, new { success = false, error = "Sai Senthil API Error" });

                var rawData = JsonConvert.DeserializeObject<JArray>(content) ?? new JArray();

                // MAP TO WAZFLO LEGO JSON
                var dashboard = new
                {
                    summary = new[] {
                        new { label = "Total Bookings", value = rawData.Count.ToString(), change = "Live", icon = "Calendar" },
                        new { label = "Total Revenue", value = "₹" + rawData.Sum(o => o["totalAmount"]?.Value<decimal>() ?? 0).ToString("N0"), change = "+12%", icon = "TrendingUp" }
                    },
                    charts = new[] {
                        new {
                            title = "Recent Booking Activity",
                            data = rawData.Take(7).Select(o => new { 
                                label = o["id"]?.ToString().Substring(0, 4) ?? "B", 
                                value = o["totalAmount"]?.Value<decimal>() ?? 0 
                            })
                        }
                    },
                    tables = new[] {
                        new {
                            title = "Recent API Bookings",
                            columns = new[] { "ID", "Customer", "Amount", "Status" },
                            rows = rawData.Take(10).Select(o => new[] {
                                o["id"]?.ToString() ?? "N/A",
                                o["customerName"]?.ToString() ?? "Guest",
                                "₹" + (o["totalAmount"]?.Value<decimal>() ?? 0).ToString(),
                                o["status"]?.ToString() ?? "Confirmed"
                            })
                        }
                    }
                };

                return Ok(new { success = true, data = dashboard });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = "Mapping Error: " + ex.Message });
            }
        }
    }
}
