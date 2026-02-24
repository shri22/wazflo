using System.Security.Cryptography;
using System.Text;
using Newtonsoft.Json;

namespace Wazflo.Api.Services
{
    public class RazorpayService : IPaymentService
    {
        private readonly HttpClient _httpClient;

        public RazorpayService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<string> CreatePaymentLinkAsync(decimal amount, string orderNumber, string customerName, string customerPhone, string keyId, string keySecret)
        {
            // Demo check
            if (string.IsNullOrEmpty(keyId) || keyId == "rzp_test_your_key_id")
            {
                return "https://rzp.io/i/demo_payment_link";
            }

            var payload = new
            {
                amount = (int)(amount * 100), // convert to paise
                currency = "INR",
                accept_partial = false,
                description = $"Order {orderNumber}",
                customer = new
                {
                    name = customerName,
                    contact = customerPhone
                },
                notify = new { sms = true, whatsapp = true },
                reminder_enable = true
            };

            var authToken = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{keyId}:{keySecret}"));
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authToken);

            var response = await _httpClient.PostAsJsonAsync("https://api.razorpay.com/v1/payment_links", payload);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Razorpay API error: {content}");
            }

            var result = JsonConvert.DeserializeObject<dynamic>(content);
            return result?.short_url ?? "";
        }

        public bool VerifySignature(string orderId, string paymentId, string signature, string keySecret)
        {
            var payload = $"{orderId}|{paymentId}";
            var secretBytes = Encoding.UTF8.GetBytes(keySecret);
            using (var hmac = new HMACSHA256(secretBytes))
            {
                var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
                var generatedSignature = BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
                return generatedSignature == signature;
            }
        }
    }
}
