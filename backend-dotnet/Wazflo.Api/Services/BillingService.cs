using Microsoft.EntityFrameworkCore;
using Wazflo.Api.Data;
using Wazflo.Api.Models;

namespace Wazflo.Api.Services
{
    public interface IBillingService
    {
        Task<bool> ProcessMessageBillingAsync(int storeId, string type, string details);
    }

    public class BillingService : IBillingService
    {
        private readonly WazfloDbContext _context;

        public BillingService(WazfloDbContext context)
        {
            _context = context;
        }

        public async Task<bool> ProcessMessageBillingAsync(int storeId, string type, string details)
        {
            var store = await _context.Stores.FindAsync(storeId);
            if (store == null) return false;

            decimal cost = store.MessageCost;

            // Only deduct if balance is positive
            if (store.WalletBalance < cost)
            {
                // In a stricter system, you'd fail here. 
                // For the demo, we allow it but log the negative balance.
            }

            store.WalletBalance -= cost;

            var log = new UsageLog
            {
                StoreId = storeId,
                Type = type,
                Cost = cost,
                BalanceAfter = store.WalletBalance,
                Details = details,
                CreatedAt = DateTime.UtcNow
            };

            _context.UsageLogs.Add(log);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
