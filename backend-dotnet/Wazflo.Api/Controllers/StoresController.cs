using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wazflo.Api.Data;
using Wazflo.Api.Models;
using Wazflo.Api.Helpers;

namespace Wazflo.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class StoresController : ControllerBase
    {
        private readonly WazfloDbContext _context;

        public StoresController(WazfloDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult> GetStores()
        {
            var isSuperAdmin = User.FindFirst("isSuperAdmin")?.Value == "true";
            if (!isSuperAdmin) return Forbid();

            var stores = await _context.Stores.ToListAsync();
            return Ok(new { success = true, data = stores });
        }

        [HttpPost]
        public async Task<ActionResult> CreateStore([FromBody] CreateStoreRequest request)
        {
            var isSuperAdmin = User.FindFirst("isSuperAdmin")?.Value == "true";
            if (!isSuperAdmin) return Forbid();

            if (string.IsNullOrEmpty(request.Name) || string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { success = false, error = "Missing required fields" });
            }

            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var store = new Store
                    {
                        Name = request.Name,
                        WhatsappPhoneNumberId = request.WhatsappPhoneNumberId,
                        WhatsappAccessToken = request.WhatsappAccessToken,
                        WhatsappVerifyToken = request.WhatsappVerifyToken,
                        RazorpayKeyId = request.RazorpayKeyId,
                        RazorpayKeySecret = request.RazorpayKeySecret,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Stores.Add(store);
                    await _context.SaveChangesAsync();

                    var user = new User
                    {
                        StoreId = store.Id,
                        Username = request.Username,
                        Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                        IsSuperAdmin = false,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();
                    return Ok(new { success = true, data = store });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(500, new { success = false, error = "Failed to create store: " + ex.Message });
                }
            });
        }

        [HttpGet("settings")]
        public async Task<ActionResult> GetSettings()
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();
            if (!storeId.HasValue) return BadRequest(new { success = false, error = "X-Store-Id header required for super admin settings access" });

            var store = await _context.Stores.FindAsync(storeId.Value);
            if (store == null) return NotFound();

            return Ok(new { success = true, data = store });
        }

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] Store settings)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();
            if (!storeId.HasValue) return BadRequest(new { success = false, error = "X-Store-Id header required for super admin settings update" });

            var store = await _context.Stores.FindAsync(storeId.Value);
            if (store == null) return NotFound();

            store.WhatsappAccessToken = settings.WhatsappAccessToken;
            store.WhatsappPhoneNumberId = settings.WhatsappPhoneNumberId;
            store.RazorpayKeyId = settings.RazorpayKeyId;
            store.RazorpayKeySecret = settings.RazorpayKeySecret;
            store.SupportPhone = settings.SupportPhone;
            store.IndustryType = settings.IndustryType;
            store.AiPersona = settings.AiPersona;
            store.ExternalApiType = settings.ExternalApiType;
            store.ExternalApiUrl = settings.ExternalApiUrl;
            store.ExternalApiKey = settings.ExternalApiKey;
            store.ExternalApiSecret = settings.ExternalApiSecret;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = store });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStore(int id)
        {
            var isSuperAdmin = User.FindFirst("isSuperAdmin")?.Value == "true";
            if (!isSuperAdmin) return Forbid();

            var store = await _context.Stores.FindAsync(id);
            if (store == null) return NotFound();

            _context.Stores.Remove(store);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Store deleted successfully" });
        }

        public class CreateStoreRequest
        {
            public string Name { get; set; } = string.Empty;
            public string? WhatsappPhoneNumberId { get; set; }
            public string? WhatsappAccessToken { get; set; }
            public string? WhatsappVerifyToken { get; set; }
            public string? RazorpayKeyId { get; set; }
            public string? RazorpayKeySecret { get; set; }
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }
    }
}
