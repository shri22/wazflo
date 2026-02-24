using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Wazflo.Api.Data;
using Wazflo.Api.Models;

namespace Wazflo.Api.Controllers
{
    [ApiController]
    [Route("api/public")]
    public class PublicBusesController : ControllerBase
    {
        private readonly WazfloDbContext _context;

        public PublicBusesController(WazfloDbContext context)
        {
            _context = context;
        }

        [HttpGet("search")]
        public async Task<ActionResult> SearchBuses([FromQuery] int storeId, [FromQuery] string fromDate, [FromQuery] string toDate, [FromQuery] string city, [FromQuery] string type)
        {
            if (!DateTime.TryParse(fromDate, out var start) || !DateTime.TryParse(toDate, out var end))
            {
                return BadRequest(new { success = false, error = "Invalid date format. Use YYYY-MM-DD." });
            }

            // Availability Logic:
            // 1. Find all bookings for this store that overlap with requested dates +/- 1 day buffer
            var bufferStart = start.AddDays(-1);
            var bufferEnd = end.AddDays(1);

            var bookedBusIds = await _context.Agreements
                .Where(a => a.StoreId == storeId && a.Status != "cancelled")
                .Where(a => (a.FromDate <= bufferEnd && a.ToDate >= bufferStart))
                .Select(a => a.BusId)
                .Distinct()
                .ToListAsync();

            // 2. Find available buses of the matching type
            var availableBuses = await _context.Buses
                .Where(b => b.StoreId == storeId && b.IsActive)
                .Where(b => b.BusType.ToUpper() == type.ToUpper())
                .Where(b => !bookedBusIds.Contains(b.Id))
                .Select(b => new {
                    b.Id,
                    b.Name,
                    b.Capacity,
                    b.BaseRate
                })
                .ToListAsync();

            return Ok(new { success = true, data = availableBuses });
        }

        [HttpGet("bus/{id}")]
        public async Task<ActionResult> GetBusDetails(int id)
        {
            var bus = await _context.Buses.FindAsync(id);
            if (bus == null) return NotFound();

            return Ok(new {
                success = true,
                data = new {
                    bus.Id,
                    bus.Name,
                    bus.BaseRate,
                    bus.Capacity,
                    bus.BusType
                }
            });
        }

        [HttpPost("book")]
        public async Task<ActionResult> FinalBook([FromBody] BookRequest request)
        {
            // Validate dates
            if (!DateTime.TryParse(request.FromDate, out var start) || !DateTime.TryParse(request.ToDate, out var end))
            {
                return BadRequest(new { success = false, error = "Invalid date format" });
            }

            // Create Agreement
            var agreementId = "WZ-" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper();
            
            var bus = await _context.Buses.FindAsync(int.Parse(request.BusId));
            if (bus == null) return NotFound(new { success = false, error = "Bus not found" });

            var agreement = new Agreement
            {
                StoreId = bus.StoreId,
                AgreementId = agreementId,
                CustomerName = request.CustomerName,
                Phone = request.Phone,
                BusId = bus.Id,
                BusType = request.BusType,
                FromDate = start,
                ToDate = end,
                Passengers = request.Passengers,
                PlacesToCover = request.PlacesToCover,
                PerDayRent = request.PerDayRent > 0 ? request.PerDayRent : bus.BaseRate,
                MountainRent = request.MountainRent,
                TotalAmount = request.TotalAmount,
                Status = "confirmed",
                CreatedAt = DateTime.UtcNow
            };

            // Calculate total if 0 provided
            if (agreement.TotalAmount <= 0)
            {
                var days = (int)(end - start).TotalDays;
                if (days <= 0) days = 1;
                agreement.TotalAmount = (agreement.PerDayRent * days) + agreement.MountainRent;
            }

            _context.Agreements.Add(agreement);
            await _context.SaveChangesAsync();

            return Ok(new { 
                success = true, 
                AgreementId = agreementId,
                Message = "Booking successful"
            });
        }

        [HttpGet("agreement/{id}")]
        public async Task<ActionResult> GetAgreement(string id)
        {
            var agreement = await _context.Agreements
                .Include(a => a.Bus)
                .FirstOrDefaultAsync(a => a.AgreementId == id);

            if (agreement == null) return NotFound();

            return Ok(new
            {
                success = true,
                data = agreement
            });
        }

        public class BookRequest
        {
            public string CustomerName { get; set; } = string.Empty;
            public string Phone { get; set; } = string.Empty;
            public string FromDate { get; set; } = string.Empty;
            public string ToDate { get; set; } = string.Empty;
            public string BusType { get; set; } = "AC";
            public int Passengers { get; set; }
            public string PlacesToCover { get; set; } = string.Empty;
            public string BusId { get; set; } = string.Empty;
            public decimal TotalAmount { get; set; }
            public decimal PerDayRent { get; set; }
            public decimal MountainRent { get; set; }
        }
    }
}
