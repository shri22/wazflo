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
    public class TemplatesController : ControllerBase
    {
        private readonly WazfloDbContext _context;

        public TemplatesController(WazfloDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult> GetTemplates()
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            IQueryable<Template> query = _context.Templates;
            if (storeId.HasValue)
                query = query.Where(t => t.StoreId == storeId.Value);

            var templates = await query.ToListAsync();
            return Ok(new { success = true, data = templates });
        }

        [HttpPost]
        public async Task<ActionResult> CreateTemplate([FromBody] Template template)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();
            if (!storeId.HasValue) return BadRequest(new { success = false, error = "X-Store-Id header required" });

            template.StoreId = storeId.Value;
            template.CreatedAt = DateTime.UtcNow;

            _context.Templates.Add(template);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = template });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTemplate(int id)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            var query = _context.Templates.Where(t => t.Id == id);
            if (storeId.HasValue)
                query = query.Where(t => t.StoreId == storeId.Value);

            var template = await query.FirstOrDefaultAsync();
            if (template == null) return NotFound();

            _context.Templates.Remove(template);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Template deleted" });
        }
    }
}
