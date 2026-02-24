using System.Net.Http.Headers;
using System.Text;
using Newtonsoft.Json;

namespace Wazflo.Api.Services
{
    public class WhatsAppService : IWhatsAppService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly string _baseUrl;

        public WhatsAppService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _baseUrl = _configuration["WhatsApp:ApiUrl"] ?? "https://graph.facebook.com/v17.0";
        }

        public async Task<object> SendTextMessageAsync(string to, string message, string phoneNumberId, string accessToken)
        {
            var payload = new
            {
                messaging_product = "whatsapp",
                to = to,
                type = "text",
                text = new { body = message }
            };

            return await PostToWhatsAppAsync(phoneNumberId, accessToken, payload);
        }

        public async Task<object> SendInteractiveButtonsAsync(string to, string bodyText, List<WhatsAppButton> buttons, string phoneNumberId, string accessToken)
        {
            var payload = new
            {
                messaging_product = "whatsapp",
                to = to,
                type = "interactive",
                interactive = new
                {
                    type = "button",
                    body = new { text = bodyText },
                    action = new
                    {
                        buttons = buttons.ConvertAll(btn => new
                        {
                            type = "reply",
                            reply = new
                            {
                                id = btn.Id,
                                title = btn.Title.Length > 20 ? btn.Title.Substring(0, 20) : btn.Title
                            }
                        })
                    }
                }
            };

            return await PostToWhatsAppAsync(phoneNumberId, accessToken, payload);
        }

        public async Task<object> SendImageMessageAsync(string to, string imageUrl, string caption, string phoneNumberId, string accessToken)
        {
            var payload = new
            {
                messaging_product = "whatsapp",
                to = to,
                type = "image",
                image = new
                {
                    link = imageUrl,
                    caption = caption
                }
            };

            return await PostToWhatsAppAsync(phoneNumberId, accessToken, payload);
        }

        public async Task<object> SendTemplateMessageAsync(string to, string templateName, string languageCode, string phoneNumberId, string accessToken)
        {
            var payload = new
            {
                messaging_product = "whatsapp",
                to = to,
                type = "template",
                template = new
                {
                    name = templateName,
                    language = new { code = languageCode }
                }
            };

            return await PostToWhatsAppAsync(phoneNumberId, accessToken, payload);
        }

        private async Task<object> PostToWhatsAppAsync(string phoneNumberId, string accessToken, object payload)
        {
            var url = $"{_baseUrl}/{phoneNumberId}/messages";
            var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"WhatsApp API error: {content}");
            }

            return JsonConvert.DeserializeObject<object>(content)!;
        }
    }
}
