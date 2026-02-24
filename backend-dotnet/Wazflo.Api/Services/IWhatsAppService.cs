using System.Threading.Tasks;

namespace Wazflo.Api.Services
{
    public interface IWhatsAppService
    {
        Task<object> SendTextMessageAsync(string to, string message, string phoneNumberId, string accessToken);
        Task<object> SendInteractiveButtonsAsync(string to, string bodyText, List<WhatsAppButton> buttons, string phoneNumberId, string accessToken);
        Task<object> SendImageMessageAsync(string to, string imageUrl, string caption, string phoneNumberId, string accessToken);
        Task<object> SendTemplateMessageAsync(string to, string templateName, string languageCode, string phoneNumberId, string accessToken);
    }

    public class WhatsAppButton
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
    }
}
