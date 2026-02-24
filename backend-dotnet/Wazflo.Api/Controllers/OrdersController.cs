using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wazflo.Api.Data;
using Wazflo.Api.Helpers;
using Wazflo.Api.Models;
using Wazflo.Api.Services;

namespace Wazflo.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly WazfloDbContext _context;
        private readonly IWhatsAppService _whatsappService;

        public OrdersController(WazfloDbContext context, IWhatsAppService whatsappService)
        {
            _context = context;
            _whatsappService = whatsappService;
        }

        [HttpGet]
        public async Task<ActionResult> GetOrders()
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            IQueryable<Order> query = _context.Orders.OrderByDescending(o => o.CreatedAt);
            if (storeId.HasValue)
                query = query.Where(o => o.StoreId == storeId.Value);

            return Ok(new { success = true, data = await query.ToListAsync() });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetOrder(int id)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            var query = _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Product)
                .Include(o => o.Variant)
                .Where(o => o.Id == id);

            if (storeId.HasValue) query = query.Where(o => o.StoreId == storeId.Value);

            var order = await query.FirstOrDefaultAsync();
            if (order == null) return NotFound();

            return Ok(new { success = true, data = order });
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] StatusUpdateRequest update)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            var query = _context.Orders.Include(o => o.Store).Where(o => o.Id == id);
            if (storeId.HasValue) query = query.Where(o => o.StoreId == storeId.Value);

            var order = await query.FirstOrDefaultAsync();
            if (order == null) return NotFound();

            order.Status    = update.Status;
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            try
            {
                string message = update.Status switch
                {
                    "confirmed" => $"✅ Your Order #{order.OrderNumber} has been CONFIRMED! We'll start preparing it right away.",
                    "shipped"   => $"🚚 Order #{order.OrderNumber} has been SHIPPED! It's on its way to you.",
                    "delivered" => $"🎉 Order #{order.OrderNumber} has been DELIVERED! Thank you for shopping with us.",
                    "cancelled" => $"❌ Order #{order.OrderNumber} has been CANCELLED. Contact us for any queries.",
                    _ => ""
                };

                if (!string.IsNullOrEmpty(message) && order.Store != null && !string.IsNullOrEmpty(order.Store.WhatsappPhoneNumberId))
                {
                    await _whatsappService.SendTextMessageAsync(
                        order.CustomerPhone,
                        message,
                        order.Store.WhatsappPhoneNumberId,
                        order.Store.WhatsappAccessToken ?? ""
                    );
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Notification failed: {ex.Message}");
            }

            return Ok(new { success = true, data = order });
        }

        [HttpGet("stats")]
        public async Task<ActionResult> GetStats()
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            var now = DateTime.UtcNow;
            IQueryable<Order> query = _context.Orders;
            if (storeId.HasValue) query = query.Where(o => o.StoreId == storeId.Value);

            var orders = await query.ToListAsync();

            return Ok(new
            {
                success = true,
                data = new
                {
                    today = new
                    {
                        count   = orders.Count(o => o.CreatedAt.Date == now.Date),
                        revenue = orders.Where(o => o.CreatedAt.Date == now.Date).Sum(o => o.TotalAmount)
                    },
                    week = new
                    {
                        count   = orders.Count(o => o.CreatedAt >= now.AddDays(-7)),
                        revenue = orders.Where(o => o.CreatedAt >= now.AddDays(-7)).Sum(o => o.TotalAmount)
                    },
                    month = new
                    {
                        count   = orders.Count(o => o.CreatedAt >= now.AddDays(-30)),
                        revenue = orders.Where(o => o.CreatedAt >= now.AddDays(-30)).Sum(o => o.TotalAmount)
                    },
                    totalOrders     = orders.Count,
                    totalRevenue    = orders.Sum(o => o.TotalAmount),
                    pendingOrders   = orders.Count(o => o.Status == "pending"),
                    deliveredOrders = orders.Count(o => o.Status == "delivered")
                }
            });
        }

        // Super Admin: platform-wide stats across all stores
        [HttpGet("platform-stats")]
        public async Task<ActionResult> GetPlatformStats()
        {
            var isSuperAdmin = User.FindFirst("isSuperAdmin")?.Value == "true";
            if (!isSuperAdmin) return Forbid();

            var stores = await _context.Stores.ToListAsync();
            var orders = await _context.Orders.ToListAsync();

            var ordersByStore = orders
                .GroupBy(o => o.StoreId)
                .Select(g =>
                {
                    var store = stores.FirstOrDefault(s => s.Id == g.Key);
                    return new
                    {
                        name        = store?.Name ?? "Unknown",
                        order_count = g.Count(),
                        revenue     = g.Sum(o => o.TotalAmount)
                    };
                })
                .OrderByDescending(o => o.revenue)
                .ToList();

            return Ok(new
            {
                success = true,
                data = new
                {
                    totalStores  = new { count = stores.Count },
                    activeStores = new { count = stores.Count(s => s.IsActive) },
                    totalOrders  = new
                    {
                        count   = orders.Count,
                        revenue = orders.Sum(o => o.TotalAmount)
                    },
                    ordersByStore
                }
            });
        }

        [HttpGet("revenue-report")]
        public async Task<ActionResult> GetRevenueReport([FromQuery] int days = 7)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            var cutoffDate = DateTime.UtcNow.Date.AddDays(-days);
            IQueryable<Order> query = _context.Orders.Where(o => o.CreatedAt >= cutoffDate);
            if (storeId.HasValue) query = query.Where(o => o.StoreId == storeId.Value);

            var report = await query
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => new
                {
                    date    = g.Key.ToString("yyyy-MM-dd"),
                    revenue = g.Sum(o => o.TotalAmount),
                    orders  = g.Count()
                })
                .OrderBy(g => g.date)
                .ToListAsync();

            return Ok(new { success = true, data = report });
        }

        public class StatusUpdateRequest
        {
            public string Status { get; set; } = string.Empty;
        }
    }
}
