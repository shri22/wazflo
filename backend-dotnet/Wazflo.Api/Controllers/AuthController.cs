using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Wazflo.Api.Data;
using Wazflo.Api.DTOs;
using Wazflo.Api.Models;

namespace Wazflo.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly WazfloDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(WazfloDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Store)
                    .FirstOrDefaultAsync(u => u.Username == request.Username);

                if (user != null && BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
                {
                    var token = GenerateJwtToken(user);

                    return Ok(new LoginResponse
                    {
                        Success = true,
                        Data = new LoginData
                        {
                            Username = user.Username,
                            StoreId = user.StoreId,
                            IsSuperAdmin = user.IsSuperAdmin ? 1 : 0,
                            IndustryType = user.Store?.IndustryType ?? "COMMERCE",
                            Token = token
                        }
                    });
                }

                return Unauthorized(new LoginResponse { Success = false, Error = "Invalid credentials" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new LoginResponse { Success = false, Error = "Login failed: " + ex.Message });
            }
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult> GetMe()
        {
            var userIdStr = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            int userId = int.Parse(userIdStr);

            var user = await _context.Users
                .Include(u => u.Store)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound();

            return Ok(new
            {
                success = true,
                data = new
                {
                    id = user.Id,
                    username = user.Username,
                    isSuperAdmin = user.IsSuperAdmin ? 1 : 0,
                    storeId = user.StoreId,
                    store = user.Store == null ? null : new
                    {
                        id = user.Store.Id,
                        name = user.Store.Name,
                        wallet_balance = user.Store.WalletBalance,
                        message_cost = user.Store.MessageCost,
                        is_active = user.Store.IsActive,
                        industry_type = user.Store.IndustryType ?? "COMMERCE",
                        whatsapp_phone_number_id = user.Store.WhatsappPhoneNumberId,
                        support_phone = user.Store.SupportPhone
                    }
                }
            });
        }

        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtSecret = _configuration["Jwt:Secret"] ?? "your_super_secret_key_change_in_production";
            var key = Encoding.ASCII.GetBytes(jwtSecret);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("id", user.Id.ToString()),
                    new Claim("username", user.Username),
                    new Claim("storeId", user.StoreId?.ToString() ?? ""),
                    new Claim("isSuperAdmin", user.IsSuperAdmin.ToString().ToLower())
                }),
                Expires = DateTime.UtcNow.AddHours(24),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
