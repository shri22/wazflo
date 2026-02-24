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
    public class BusesController : ControllerBase
    {
        private readonly WazfloDbContext _context;

        public BusesController(WazfloDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult> GetBuses()
        {
            var (storeId, _, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            IQueryable<Bus> query = _context.Buses;
            if (storeId.HasValue)
                query = query.Where(b => b.StoreId == storeId.Value);

            var buses = await query.ToListAsync();
            return Ok(new { success = true, data = buses });
        }

        [HttpPost]
        public async Task<ActionResult> CreateBus([FromBody] Bus bus)
        {
            var (storeId, _, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();
            if (!storeId.HasValue) return BadRequest(new { success = false, error = "X-Store-Id required" });

            bus.StoreId = storeId.Value;
            bus.CreatedAt = DateTime.UtcNow;

            _context.Buses.Add(bus);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = bus });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBus(int id, [FromBody] Bus busUpdate)
        {
            var (storeId, _, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            var bus = await _context.Buses.FindAsync(id);
            if (bus == null) return NotFound();
            if (storeId.HasValue && bus.StoreId != storeId.Value) return Forbid();

            bus.Name = busUpdate.Name;
            bus.BusNumber = busUpdate.BusNumber;
            bus.BusType = busUpdate.BusType;
            bus.Capacity = busUpdate.Capacity;
            bus.BaseRate = busUpdate.BaseRate;
            bus.IsActive = busUpdate.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { success = true, data = bus });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBus(int id)
        {
            var (storeId, _, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            var bus = await _context.Buses.FindAsync(id);
            if (bus == null) return NotFound();
            if (storeId.HasValue && bus.StoreId != storeId.Value) return Forbid();

            _context.Buses.Remove(bus);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Bus deleted" });
        }
    }

    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AgreementsController : ControllerBase
    {
        private readonly WazfloDbContext _context;

        public AgreementsController(WazfloDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult> GetAgreements()
        {
            var (storeId, _, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            IQueryable<Agreement> query = _context.Agreements.Include(a => a.Bus);
            if (storeId.HasValue)
                query = query.Where(a => a.StoreId == storeId.Value);

            var list = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
            return Ok(new { success = true, data = list });
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            var (storeId, _, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            var agreement = await _context.Agreements.FindAsync(id);
            if (agreement == null) return NotFound();
            if (storeId.HasValue && agreement.StoreId != storeId.Value) return Forbid();

            agreement.Status = request.Status;
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        [HttpGet("stats")]
        public async Task<ActionResult> GetStats()
        {
            var (storeId, _, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            var now = DateTime.UtcNow;
            IQueryable<Agreement> query = _context.Agreements;
            if (storeId.HasValue) query = query.Where(a => a.StoreId == storeId.Value);

            var list = await query.ToListAsync();

            return Ok(new
            {
                success = true,
                data = new
                {
                    today = new
                    {
                        count = list.Count(a => a.CreatedAt.Date == now.Date),
                        revenue = list.Where(a => a.CreatedAt.Date == now.Date).Sum(a => a.TotalAmount)
                    },
                    week = new
                    {
                        count = list.Count(a => a.CreatedAt >= now.AddDays(-7)),
                        revenue = list.Where(a => a.CreatedAt >= now.AddDays(-7)).Sum(a => a.TotalAmount)
                    },
                    month = new
                    {
                        count = list.Count(a => a.CreatedAt >= now.AddDays(-30)),
                        revenue = list.Where(a => a.CreatedAt >= now.AddDays(-30)).Sum(a => a.TotalAmount)
                    }
                }
            });
        }

        [HttpGet("revenue-report")]
        public async Task<ActionResult> GetRevenueReport([FromQuery] int days = 7)
        {
            var (storeId, _, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            var cutoff = DateTime.UtcNow.Date.AddDays(-days);
            IQueryable<Agreement> query = _context.Agreements.Where(a => a.CreatedAt >= cutoff);
            if (storeId.HasValue) query = query.Where(a => a.StoreId == storeId.Value);

            var report = await query
                .GroupBy(a => a.CreatedAt.Date)
                .Select(g => new
                {
                    date = g.Key.ToString("yyyy-MM-dd"),
                    revenue = g.Sum(a => a.TotalAmount),
                    count = g.Count()
                })
                .OrderBy(g => g.date)
                .ToListAsync();

            return Ok(new { success = true, data = report });
        }

        public class UpdateStatusRequest { public string Status { get; set; } = string.Empty; }
    }
}
