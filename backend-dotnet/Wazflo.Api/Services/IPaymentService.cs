using System.Threading.Tasks;

namespace Wazflo.Api.Services
{
    public interface IPaymentService
    {
        Task<string> CreatePaymentLinkAsync(decimal amount, string orderNumber, string customerName, string customerPhone, string keyId, string keySecret);
        bool VerifySignature(string orderId, string paymentId, string signature, string keySecret);
    }
}
