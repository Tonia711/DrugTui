using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using UserAuthApi.Data;
using UserAuthApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace UserAuthApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UsersController : ControllerBase
    {
        // Inject database context and configuration (e.g., JWT secret settings)
        private readonly AppDbContext _context;
        private readonly PasswordHasher<User> _hasher;
        private readonly IConfiguration _config;

        public UsersController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _hasher = new PasswordHasher<User>();
            _config = config;
        }

        // POST /Users/register
        // Admin creates a new user with hashed password and stores it in the database
        [HttpPost("register")]
        [Authorize(Roles = "Admin")]
        public IActionResult Register(RegisterDto dto)
        {
            if (_context.Users.Any(u => u.Email == dto.Email))
            {
                return BadRequest("Email already registered.");
            }

            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                Role = "User",
                Bio = dto.Bio
            };

            user.PasswordHash = _hasher.HashPassword(user, dto.Password);

            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok(new { message = "User created successfully by admin." });
        }

        // POST /Users/login
        // Authenticates a user and returns a JWT if the credentials are valid
        [HttpPost("login")]
        public IActionResult Login(LoginDto dto)
        {
            var loginIdentifier = dto.Email.Trim();

            var user = _context.Users.FirstOrDefault(u =>
                u.Email == loginIdentifier || u.Username == loginIdentifier);
            if (user == null)
            {
                return Unauthorized("Invalid credentials.");
            }

            var hasher = new PasswordHasher<User>();
            var result = hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);

            if (result == PasswordVerificationResult.Failed)
            {
                return Unauthorized("Invalid credentials.");
            }

            // Create JWT claims based on user identity
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new
            {
                token = tokenString,
                user = new { user.Id, user.Username, user.Email, user.Role, user.Bio }
            });
        }

        // GET /Users/me
        // Returns the currently authenticated user's profile using the token claims
        [HttpGet("me")]
        [Authorize]
        public IActionResult GetMe()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null)
            {
                return Unauthorized("Token is invalid.");
            }

            int userId = int.Parse(userIdClaim.Value);

            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            return Ok(new
            {
                user.Id,
                user.Username,
                user.Email,
                user.Role,
                user.Bio
            });
        }

        // PUT /Users/me
        // Updates the current authenticated user's profile
        [HttpPut("me")]
        [Authorize]
        public IActionResult UpdateMe(UpdateUserDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("Invalid token.");
            }

            int userId = int.Parse(userIdClaim.Value);
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            if (_context.Users.Any(u => u.Username == dto.Username && u.Id != userId))
            {
                return BadRequest("Username already exists.");
            }

            user.Username = dto.Username;
            user.Bio = dto.Bio;

            _context.SaveChanges();

            return Ok(new
            {
                user.Id,
                user.Username,
                user.Email,
                user.Role,
                user.Bio
            });
        }

        // DELETE /Users/me
        // Deletes the currently authenticated user's account
        [HttpDelete("me")]
        [Authorize]
        public IActionResult DeleteMe()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("Invalid token.");
            }

            int userId = int.Parse(userIdClaim.Value);
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            _context.Users.Remove(user);
            _context.SaveChanges();

            return Ok(new { message = "User deleted successfully." });
        }
    }
}
