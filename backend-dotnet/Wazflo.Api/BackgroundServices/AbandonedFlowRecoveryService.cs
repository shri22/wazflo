using Microsoft.EntityFrameworkCore;
using Wazflo.Api.Data;
using Wazflo.Api.Models;
using Wazflo.Api.Services;

namespace Wazflo.Api.BackgroundServices
{
    /// <summary>
    /// Runs every hour. Finds conversations that have been inactive for > 2 hours
    /// (potential abandoned flows) and sends a recovery WhatsApp message.
    /// </summary>
    public class AbandonedFlowRecoveryService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AbandonedFlowRecoveryService> _logger;
        private static readonly TimeSpan _interval = TimeSpan.FromHours(1);
        private static readonly TimeSpan _abandonedThreshold = TimeSpan.FromHours(2);

        public AbandonedFlowRecoveryService(
            IServiceProvider serviceProvider,
            ILogger<AbandonedFlowRecoveryService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Abandoned Flow Recovery Service started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(_interval, stoppingToken);

                try
                {
                    await RunRecoveryAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in Abandoned Flow Recovery Service.");
                }
            }
        }

        private async Task RunRecoveryAsync(CancellationToken ct)
        {
            using var scope = _serviceProvider.CreateScope();
            var context          = scope.ServiceProvider.GetRequiredService<WazfloDbContext>();
            var whatsappService  = scope.ServiceProvider.GetRequiredService<IWhatsAppService>();

            var cutoff = DateTime.UtcNow - _abandonedThreshold;

            // Find conversations that went quiet and have no completed order
            var abandonedConversations = await context.Conversations
                .Include(c => c.Store)
                .Where(c =>
                    c.LastMessageAt < cutoff &&
                    c.LastMessageAt > DateTime.UtcNow.AddHours(-24) && // only within last 24h
                    c.Store != null &&
                    c.Store.IsActive &&
                    !string.IsNullOrEmpty(c.Store.WhatsappPhoneNumberId))
                .ToListAsync(ct);

            _logger.LogInformation("Found {Count} potentially abandoned conversations.", abandonedConversations.Count);

            foreach (var conv in abandonedConversations)
            {
                // Skip if customer already placed an order recently
                var hasRecentOrder = await context.Orders.AnyAsync(o =>
                    o.StoreId == conv.StoreId &&
                    o.CustomerPhone == conv.CustomerPhone &&
                    o.CreatedAt > cutoff, ct);

                if (hasRecentOrder) continue;

                try
                {
                    var recoveryMessage =
                        $"👋 Hi! We noticed you were browsing our catalog earlier.\n\n" +
                        $"Did you find what you were looking for? Reply *CATALOG* to see our products again, " +
                        $"or *HELP* to speak with our team. 😊";

                    await whatsappService.SendTextMessageAsync(
                        conv.CustomerPhone,
                        recoveryMessage,
                        conv.Store!.WhatsappPhoneNumberId!,
                        conv.Store.WhatsappAccessToken ?? ""
                    );

                    _logger.LogInformation("Recovery message sent to {Phone} for store {StoreId}.",
                        conv.CustomerPhone, conv.StoreId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send recovery message to {Phone}.", conv.CustomerPhone);
                }
            }
        }
    }
}
