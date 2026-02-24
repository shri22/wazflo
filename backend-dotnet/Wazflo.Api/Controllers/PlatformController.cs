using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wazflo.Api.Data;
using Wazflo.Api.Models;
using Wazflo.Api.Services;
using Wazflo.Api.Helpers;

namespace Wazflo.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PlatformController : ControllerBase
    {
        private readonly WazfloDbContext _context;
        private readonly IWhatsAppService _whatsappService;

        public PlatformController(WazfloDbContext context, IWhatsAppService whatsappService)
        {
            _context = context;
            _whatsappService = whatsappService;
        }

        [HttpGet("conversations")]
        public async Task<ActionResult> GetConversations()
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            IQueryable<Conversation> query = _context.Conversations.OrderByDescending(c => c.LastMessageAt);
            if (storeId.HasValue)
                query = query.Where(c => c.StoreId == storeId.Value);

            var conversations = await query.ToListAsync();
            return Ok(new { success = true, data = conversations });
        }

        [HttpGet("messages/{phone}")]
        public async Task<ActionResult> GetChatHistory(string phone)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            IQueryable<Message> query = _context.Messages.Where(m => m.CustomerPhone == phone).OrderBy(m => m.CreatedAt);
            if (storeId.HasValue)
                query = query.Where(m => m.StoreId == storeId.Value);

            var messages = await query.ToListAsync();
            return Ok(new { success = true, data = messages });
        }

        [HttpPost("messages/send")]
        public async Task<ActionResult> SendManualMessage([FromBody] SendMessageRequest request)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();
            if (!storeId.HasValue) return BadRequest(new { success = false, error = "X-Store-Id header required" });

            var store = await _context.Stores.FindAsync(storeId.Value);
            if (store == null) return NotFound();

            try
            {
                await _whatsappService.SendTextMessageAsync(
                    request.Phone,
                    request.Message,
                    store.WhatsappPhoneNumberId ?? "",
                    store.WhatsappAccessToken ?? ""
                );

                var message = new Message
                {
                    StoreId = storeId.Value,
                    CustomerPhone = request.Phone,
                    Direction = "out",
                    Body = request.Message,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Messages.Add(message);
                
                // Update conversation
                var conversation = await _context.Conversations.FirstOrDefaultAsync(c => c.StoreId == storeId.Value && c.CustomerPhone == request.Phone);
                if (conversation == null)
                {
                    conversation = new Conversation { StoreId = storeId.Value, CustomerPhone = request.Phone };
                    _context.Conversations.Add(conversation);
                }
                conversation.LastMessageAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, data = message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpGet("usage")]
        public async Task<ActionResult> GetUsageLogs()
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            IQueryable<UsageLog> query = _context.UsageLogs.OrderByDescending(u => u.CreatedAt);
            if (storeId.HasValue)
                query = query.Where(u => u.StoreId == storeId.Value);

            var logs = await query.ToListAsync();
            return Ok(new { success = true, data = logs });
        }

        [HttpGet("broadcasts")]
        public async Task<ActionResult> GetBroadcasts()
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            IQueryable<Broadcast> query = _context.Broadcasts.OrderByDescending(b => b.CreatedAt);
            if (storeId.HasValue)
                query = query.Where(b => b.StoreId == storeId.Value);

            var broadcasts = await query.ToListAsync();
            return Ok(new { success = true, data = broadcasts });
        }

        [HttpPost("broadcasts")]
        public async Task<ActionResult> CreateBroadcast([FromBody] Broadcast broadcast)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();
            if (!storeId.HasValue) return BadRequest(new { success = false, error = "X-Store-Id header required" });

            broadcast.StoreId = storeId.Value;
            broadcast.CreatedAt = DateTime.UtcNow;
            broadcast.Status = "pending";

            _context.Broadcasts.Add(broadcast);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = broadcast });
        }

        [HttpPost("stores/{id}/balance")]
        public async Task<ActionResult> AddBalance(int id, [FromBody] AddBalanceRequest request)
        {
            var isSuperAdmin = User.FindFirst("isSuperAdmin")?.Value == "true";
            if (!isSuperAdmin) return Forbid();

            var store = await _context.Stores.FindAsync(id);
            if (store == null) return NotFound();

            store.WalletBalance += request.Amount;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = store });
        }

        public class SendMessageRequest
        {
            public string Phone { get; set; } = string.Empty;
            public string Message { get; set; } = string.Empty;
        }

        public class AddBalanceRequest
        {
            public decimal Amount { get; set; }
        }
    }
}
