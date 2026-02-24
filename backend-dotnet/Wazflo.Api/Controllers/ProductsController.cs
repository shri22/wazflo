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
    public class ProductsController : ControllerBase
    {
        private readonly WazfloDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ProductsController(WazfloDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // ─── PRODUCTS ────────────────────────────────────────────────────────────

        [HttpGet]
        public async Task<ActionResult> GetProducts()
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            IQueryable<Product> query = _context.Products.Include(p => p.Variants);

            if (storeId.HasValue)
                query = query.Where(p => p.StoreId == storeId.Value);
            // Super admin with no X-Store-Id: return all products

            var products = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
            return Ok(new { success = true, data = products });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetProduct(int id)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            var query = _context.Products.Include(p => p.Variants).Where(p => p.Id == id);
            if (storeId.HasValue)
                query = query.Where(p => p.StoreId == storeId.Value);

            var product = await query.FirstOrDefaultAsync();
            if (product == null) return NotFound();

            return Ok(new { success = true, data = product });
        }

        [HttpPost]
        [Consumes("multipart/form-data", "application/x-www-form-urlencoded", "application/json")]
        public async Task<ActionResult> CreateProduct([FromForm] ProductFormRequest request)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();
            if (!storeId.HasValue) return BadRequest(new { success = false, error = "X-Store-Id header required for super admin product creation" });

            string? imageUrl = null;
            if (request.Image != null && request.Image.Length > 0)
                imageUrl = await SaveImageAsync(request.Image);

            var product = new Product
            {
                StoreId     = storeId.Value,
                Name        = request.Name,
                Description = request.Description,
                BasePrice   = request.BasePrice,
                Category    = request.Category,
                IsActive    = request.IsActive != 0,
                ImageUrl    = imageUrl ?? request.ImageUrl,
                CreatedAt   = DateTime.UtcNow,
                UpdatedAt   = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = product });
        }

        [HttpPut("{id}")]
        [Consumes("multipart/form-data", "application/x-www-form-urlencoded", "application/json")]
        public async Task<ActionResult> UpdateProduct(int id, [FromForm] ProductFormRequest request)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            var query = _context.Products.Where(p => p.Id == id);
            if (storeId.HasValue) query = query.Where(p => p.StoreId == storeId.Value);

            var product = await query.FirstOrDefaultAsync();
            if (product == null) return NotFound();

            if (request.Image != null && request.Image.Length > 0)
                product.ImageUrl = await SaveImageAsync(request.Image);
            else if (!string.IsNullOrEmpty(request.ImageUrl))
                product.ImageUrl = request.ImageUrl;

            product.Name        = request.Name;
            product.Description = request.Description;
            product.BasePrice   = request.BasePrice;
            product.Category    = request.Category;
            product.IsActive    = request.IsActive != 0;
            product.UpdatedAt   = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { success = true, data = product });
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteProduct(int id)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            var query = _context.Products.Include(p => p.Variants).Where(p => p.Id == id);
            if (storeId.HasValue) query = query.Where(p => p.StoreId == storeId.Value);

            var product = await query.FirstOrDefaultAsync();
            if (product == null) return NotFound();

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Product deleted successfully" });
        }

        [HttpPost("import")]
        public async Task<ActionResult> ImportProducts([FromBody] ImportRequest request)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();
            if (!storeId.HasValue) return BadRequest(new { success = false, error = "X-Store-Id header required" });

            if (request.Products == null || request.Products.Count == 0)
                return BadRequest(new { success = false, error = "No products provided" });

            int imported = 0;
            foreach (var p in request.Products)
            {
                if (string.IsNullOrWhiteSpace(p.Name)) continue;
                decimal.TryParse(p.BasePrice?.ToString(), out var price);

                _context.Products.Add(new Product
                {
                    StoreId     = storeId.Value,
                    Name        = p.Name,
                    Description = p.Description,
                    BasePrice   = price,
                    Category    = p.Category,
                    IsActive    = true,
                    CreatedAt   = DateTime.UtcNow,
                    UpdatedAt   = DateTime.UtcNow
                });
                imported++;
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = $"{imported} products imported successfully" });
        }

        // ─── VARIANTS ────────────────────────────────────────────────────────────

        [HttpGet("{productId}/variants")]
        public async Task<ActionResult> GetVariants(int productId)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            var productQuery = _context.Products.Where(p => p.Id == productId);
            if (storeId.HasValue) productQuery = productQuery.Where(p => p.StoreId == storeId.Value);
            if (!await productQuery.AnyAsync()) return NotFound();

            var variantQuery = _context.Variants.Where(v => v.ProductId == productId);
            if (storeId.HasValue) variantQuery = variantQuery.Where(v => v.StoreId == storeId.Value);

            return Ok(new { success = true, data = await variantQuery.ToListAsync() });
        }

        [HttpPost("{productId}/variants")]
        public async Task<ActionResult> CreateVariant(int productId, [FromBody] Variant variant)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();
            if (!storeId.HasValue) return BadRequest(new { success = false, error = "X-Store-Id header required" });

            var productExists = await _context.Products
                .AnyAsync(p => p.Id == productId && p.StoreId == storeId.Value);
            if (!productExists) return NotFound();

            variant.ProductId = productId;
            variant.StoreId   = storeId.Value;
            variant.CreatedAt = DateTime.UtcNow;

            _context.Variants.Add(variant);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = variant });
        }

        [HttpPut("{productId}/variants/{variantId}")]
        public async Task<ActionResult> UpdateVariant(int productId, int variantId, [FromBody] Variant update)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            var variantQuery = _context.Variants
                .Where(v => v.Id == variantId && v.ProductId == productId);
            if (storeId.HasValue) variantQuery = variantQuery.Where(v => v.StoreId == storeId.Value);

            var variant = await variantQuery.FirstOrDefaultAsync();
            if (variant == null) return NotFound();

            variant.Name          = update.Name;
            variant.Sku           = update.Sku;
            variant.Price         = update.Price;
            variant.StockQuantity = update.StockQuantity;
            variant.Attributes    = update.Attributes;

            await _context.SaveChangesAsync();
            return Ok(new { success = true, data = variant });
        }

        [HttpDelete("{productId}/variants/{variantId}")]
        public async Task<ActionResult> DeleteVariant(int productId, int variantId)
        {
            var (storeId, isSuperAdmin, isUnauthorized) = StoreContext.Resolve(User, Request.Headers);
            if (isUnauthorized) return Unauthorized();

            var variantQuery = _context.Variants
                .Where(v => v.Id == variantId && v.ProductId == productId);
            if (storeId.HasValue) variantQuery = variantQuery.Where(v => v.StoreId == storeId.Value);

            var variant = await variantQuery.FirstOrDefaultAsync();
            if (variant == null) return NotFound();

            _context.Variants.Remove(variant);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Variant deleted" });
        }

        // ─── HELPERS ─────────────────────────────────────────────────────────────

        private async Task<string> SaveImageAsync(IFormFile image)
        {
            var uploadsDir = Path.Combine(_env.ContentRootPath, "uploads");
            Directory.CreateDirectory(uploadsDir);

            var ext      = Path.GetExtension(image.FileName);
            var fileName = $"{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await image.CopyToAsync(stream);

            return $"/uploads/{fileName}";
        }

        // ─── REQUEST MODELS ──────────────────────────────────────────────────────

        public class ProductFormRequest
        {
            public string Name { get; set; } = string.Empty;
            public string? Description { get; set; }
            public decimal BasePrice { get; set; }
            public string? Category { get; set; }
            public int IsActive { get; set; } = 1;
            public string? ImageUrl { get; set; }
            public IFormFile? Image { get; set; }
        }

        public class ImportRequest
        {
            public List<ImportProductItem>? Products { get; set; }
        }

        public class ImportProductItem
        {
            public string Name { get; set; } = string.Empty;
            public string? Description { get; set; }
            public object? BasePrice { get; set; }
            public string? Category { get; set; }
        }
    }
}
